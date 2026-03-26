# Secret Santa

A web application for organising Secret Santa gift exchanges.

## Running the application

### Option A — Dev container (recommended)

Prerequisites: Docker, VS Code with the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension.

1. Open the repository folder in VS Code.
2. When prompted, click **Reopen in Container** (or run `Dev Containers: Reopen in Container` from the command palette).
3. VS Code builds the container image and starts MongoDB automatically — no extra setup needed.
4. Inside the container terminal, install dependencies:
   ```bash
   pnpm install
   ```
5. Start the services in separate terminals:
   ```bash
   pnpm run dev:backend   # http://localhost:3000
   pnpm run dev:web       # http://localhost:4200
   ```

MongoDB is reachable at `mongodb://db:27017` from inside the container.

---

### Option B — Local machine (without dev container)

Prerequisites: Node.js 24.x, pnpm 10.x, Docker (for MongoDB).

1. Start MongoDB:
   ```bash
   docker compose -f .devcontainer/docker-compose.yml up db -d
   ```
   MongoDB will be available at `mongodb://localhost:27017`.

2. Create a `.env.development` file at the workspace root:
   ```env
   DB_PROVIDER=mongo
   # when running in devcontainers
   MONGO_URI=mongodb://db:27017/secretsanta
   # when running directly on local machine
   # MONGO_URI=mongodb://localhost:27017/secretsanta
   PORT=3000
   ```

   See `.env.production.example` as a reference for production values.

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start the services in separate terminals:
   ```bash
   pnpm run dev:backend   # http://localhost:3000
   pnpm run dev:web       # http://localhost:4200
   ```

---

## Further reading

- [Architecture](docs/architecture.md)
- [Local development guide](docs/local-development.md)
- [GCP deployment](docs/gcp-deployment.md)
- [Architecture Decision Records](docs/adr/)
