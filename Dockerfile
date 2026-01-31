# Stage 1: Build frontend
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_CONVEX_URL=http://127.0.0.1:3210
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

RUN bun run build

# Stage 2: Production — unified server
FROM oven/bun:1-slim

WORKDIR /app

RUN addgroup --system --gid 1001 clawwatch && \
    adduser --system --uid 1001 --ingroup clawwatch clawwatch

# Copy built frontend
COPY --from=builder --chown=clawwatch:clawwatch /app/dist ./dist

# Copy server and collector source
COPY --chown=clawwatch:clawwatch server.ts ./
COPY --chown=clawwatch:clawwatch collector/ ./collector/
COPY --chown=clawwatch:clawwatch convex/ ./convex/
COPY --chown=clawwatch:clawwatch package.json bun.lock* ./

RUN bun install --frozen-lockfile --production

USER clawwatch

EXPOSE 5173

CMD ["bun", "run", "server.ts"]
