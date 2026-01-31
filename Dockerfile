# Stage 1: Build
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_CONVEX_URL=http://127.0.0.1:3210
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

RUN bun run build

# Stage 2: Production — serve static files
FROM oven/bun:1-slim

WORKDIR /app

# Install static file server
RUN bun add serve && \
    addgroup --system --gid 1001 clawwatch && \
    adduser --system --uid 1001 --ingroup clawwatch clawwatch

COPY --from=builder --chown=clawwatch:clawwatch /app/dist ./dist

USER clawwatch

EXPOSE 5173

CMD ["bunx", "serve", "dist", "-p", "5173", "-s"]
