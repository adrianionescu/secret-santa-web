# ---- Stage 1: Build ----
FROM node:24-alpine AS builder
WORKDIR /app

RUN corepack enable pnpm

# Copy workspace config files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.base.json tsconfig.json nx.json buf.yaml buf.gen.yaml ./

# Copy source for proto, shared libs, and API
COPY proto/ proto/
COPY libs/ libs/
COPY apps/api/ apps/api/

# Install all dependencies (includes @bufbuild/buf which provides the buf CLI)
RUN pnpm install --frozen-lockfile

# Generate proto types using the locally installed buf
RUN mkdir -p libs/proto/src/gen && node_modules/.bin/buf generate

# Build the API
RUN pnpm nx build api --prod

# ---- Stage 2: Runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built output
COPY --from=builder /app/dist/apps/api ./

# Install only production dependencies
RUN npm install --omit=dev --ignore-scripts

USER appuser
EXPOSE 3000
CMD ["node", "main.js"]
