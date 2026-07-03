# Configurable email allowlist per environment

- **Status:** Accepted
- **Date:** 2026-06-18

## Context

Google sign-in is restricted to an allowlist of email addresses. The allowlist
was loaded from a file (`apps/backend/allowed-emails.txt`) **baked into the
backend Docker image at build time**. Because the same image (and file) was used
everywhere, local and GCP necessarily shared one allowlist — there was no clean
way to allow different accounts per environment.

The repo already configures the backend per environment through committed
`.env.*` files:

- **Local** — `.env.development`, loaded into `process.env` by Nx on `nx serve`.
- **GCP** — `.env.production.gcp`, applied to the Cloud Run service via the
  `env_vars_file:` input of the deploy step in `.github/workflows/deploy_gcp.yml`
  (secrets are layered on top via that step's inline `env_vars:`).

## Decision

Drive the allowlist from an `ALLOWED_EMAILS` variable carried by those same
`.env.*` files:

- `AuthService.loadAllowedEmails()` reads `process.env.ALLOWED_EMAILS` — a
  comma-separated, case-insensitive list — and **fails fast** at startup if it is
  unset or empty.
- `ALLOWED_EMAILS` is added to `.env.development` (local) and
  `.env.production.gcp` (GCP). No new app loading mechanism is introduced: dev
  relies on Nx, prod on the existing `env_vars_file` deploy input.
- The `allowed-emails.txt` file, its `COPY` in the Dockerfile, and the
  `ALLOWED_EMAILS_PATH` variable are removed.

## Consequences

- Each environment owns its allowlist; changing production access is an edit to
  `.env.production.gcp` + push to `main`.
- A missing/empty `ALLOWED_EMAILS` now crashes the backend on boot instead of
  silently allowing no one — misconfiguration is obvious.
- The value reaches Cloud Run as an env var; multi-email (comma-containing)
  values must survive the `env_vars_file` round-trip — verify after first deploy.

## Alternatives considered

- **Inject `ALLOWED_EMAILS` via a new GitHub secret + inline `env_vars`** —
  rejected: keeps the allowlist in CI config rather than alongside the other
  committed env files.
- **Bundle a separate `.env.production` into the image and load it at runtime via
  `ConfigModule` + `NODE_ENV`** — rejected: introduces a second prod env file and
  a new loading path that diverges from the existing `.env.production.gcp` /
  `env_vars_file` pattern.
- **Store the allowlist in Firestore/Mongo** — rejected as overkill; no runtime
  editing requirement.
