# Stage 1: Build frontend
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock* ./
COPY apps/clawwatch/package.json apps/clawwatch/
COPY packages/core/package.json packages/core/
COPY packages/ui/package.json packages/ui/
COPY tooling/typescript/package.json tooling/typescript/
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_CONVEX_URL=http://127.0.0.1:3210
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

# Build frontend (codegen should be run locally before Docker build)
RUN bun run --filter='clawwatch-app' build

# Stage 2: Production — TanStack Start / Nitro server
FROM oven/bun:1-slim

WORKDIR /app

RUN groupadd --system --gid 1001 clawwatch && \
    useradd --system --uid 1001 --gid clawwatch clawwatch

# Copy built TanStack Start app (Nitro server)
COPY --from=builder --chown=clawwatch:clawwatch /app/apps/clawwatch/.output ./.output

USER clawwatch

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
