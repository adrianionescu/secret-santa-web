# Architecture

## Overview

Secret Santa is a full-stack web application organized as a **monorepo** using [Nx](https://nx.dev) and [pnpm workspaces](https://pnpm.io/workspaces). The backend and frontend are independent deployable services that communicate over **gRPC-Web** (via ConnectRPC).

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│                                                     │
│   Angular 21 SPA  ──── gRPC-Web (ConnectRPC) ────► │
└──────────────────────────────────┬──────────────────┘
                                   │ HTTP POST
                                   ▼
                    ┌──────────────────────────┐
                    │   NestJS 11 (API)        │
                    │                          │
                    │  ConnectRPC middleware   │
                    │  └── SessionService      │
                    │       └── ISessionRepo   │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    │                          │
               (local dev)                 (GCP prod)
            MongoDB (Mongoose)         Cloud Firestore
```

---

## Repository Structure

```
secret-santa-web/
├── apps/
│   ├── backend/       # NestJS backend
│   └── web/           # Angular frontend
├── libs/
│   ├── proto/         # Generated TypeScript from .proto files
│   └── shared/        # Shared interfaces (ISessionRepository, models)
├── proto/
│   └── secretsanta/v1/session.proto   # gRPC API contract
├── .github/workflows/ # CI/CD pipelines
├── buf.yaml           # Buf workspace config (proto linting)
└── buf.gen.yaml       # Proto → TypeScript code generation config
```

---

## Tech Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| Monorepo | [Nx](https://nx.dev) | 22.6 | Build system, task orchestration, caching |
| Package manager | [pnpm](https://pnpm.io) | 10.32 | Workspace dependency management |
| **Frontend** | [Angular](https://angular.dev) | 21 | SPA framework (standalone components) |
| **Backend** | [NestJS](https://nestjs.com) | 11 | Node.js server framework |
| **API protocol** | [ConnectRPC](https://connectrpc.com) | 2.x | gRPC-Web without an Envoy proxy |
| Proto tooling | [Buf](https://buf.build) + protoc-gen-es | 2.x | `.proto` → TypeScript code generation |
| DB (local) | [MongoDB](https://mongodb.com) + Mongoose | 9.x | Local development database |
| DB (GCP) | [Cloud Firestore](https://cloud.google.com/firestore) | 8.x | Production database |
| Language | TypeScript | 5.7 | Both frontend and backend |

---

## API Design

The API is defined as a single `.proto` file at [`proto/secretsanta/v1/session.proto`](../proto/secretsanta/v1/session.proto).

### Service: `SessionService`

| RPC | Request | Response | Description |
|---|---|---|---|
| `GeneratePairs` | `participants[]` | `pairs` (JSON string) | Generate pairs without saving |
| `SaveSession` | `name`, `participants[]`, `pairs` | `Session` | Persist a session to the DB |
| `ListSessions` | _(empty)_ | `Session[]` | All sessions, newest first |
| `GetLatestSession` | _(empty)_ | `Session` or `found=false` | Most recent session |

### `Session` Entity

```
Session {
  name:         string  // unique identifier
  created_at:   string  // ISO-8601 UTC timestamp
  pairs:        string  // JSON-encoded: [{"giver":"Alice","receiver":"Bob"}, ...]
  participants: string[]
}
```

### Why ConnectRPC?

Browsers cannot speak native gRPC (HTTP/2 binary framing is hidden from browser fetch/XHR APIs). The classic workaround requires an **Envoy proxy** to translate gRPC-Web → gRPC. ConnectRPC eliminates this by implementing its own framing protocol over standard HTTP/1.1 POST requests, so the NestJS server can receive calls directly from the browser — no proxy needed.

---

## Backend (`apps/backend`)

```
src/
├── main.ts                         # Bootstrap, CORS config
├── app/
│   ├── app.module.ts               # Root module, mounts ConnectMiddleware
│   └── app.controller.ts           # GET /health
├── connect/
│   └── connect.middleware.ts       # Mounts ConnectRPC router on all routes
├── session/
│   ├── session.module.ts
│   ├── session.service.ts          # Business logic, pair generation
│   └── session-connect.handler.ts  # ConnectRPC ↔ SessionService bridge
└── repository/
    ├── repository.module.ts        # Dynamic module: selects DB adapter
    ├── mongo/
    │   ├── session.schema.ts       # Mongoose schema
    │   └── mongo-session.repository.ts
    └── firestore/
        └── firestore-session.repository.ts
```

### Repository Pattern

`ISessionRepository` (defined in `libs/shared`) is the port interface. The correct adapter is injected at startup based on the `DB_PROVIDER` environment variable:

```
DB_PROVIDER=mongo      → MongoSessionRepository  (default, local dev)
DB_PROVIDER=firestore  → FirestoreSessionRepository  (GCP production)
```

### Pair Generation Algorithm

Pairs are generated using a **Fisher-Yates shuffle** applied to the receiver list. The algorithm retries up to 100 times until it produces a valid assignment where:
- No participant is paired with themselves
- No `(giver → receiver)` pair matches any pair from the previous session

---

## Frontend (`apps/web`)

```
src/app/
├── app.ts                          # Root component
├── app.config.ts                   # Angular providers (provideHttpClient)
├── components/
│   ├── session-form/               # Top section: manage participants, generate & save
│   └── session-list/               # Bottom section: display all saved sessions
└── services/
    └── session.service.ts          # ConnectRPC client wrapper (returns RxJS Observables)
```

The Angular service wraps the `createClient()` calls from `@connectrpc/connect-web` and converts the resulting Promises to RxJS `Observable`s so they integrate naturally with Angular's change detection.

---

## Proto Code Generation

The TypeScript types in `libs/proto/src/gen/` are **generated** — do not edit them manually.

To regenerate after changing the `.proto` file:

```bash
pnpm nx run proto:proto-gen
```

This runs `buf generate` using the config in `buf.gen.yaml`, invoking `protoc-gen-es` and writing output to `libs/proto/src/gen/`.

---

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| [ci.yml](../.github/workflows/ci.yml) | Pull Request → `main` | Lint, test, build (Nx affected) |
| [deploy.yml](../.github/workflows/deploy.yml) | Push to `main` | Build Docker images, push to Artifact Registry, deploy to Cloud Run |
