# Use Bun for faster builds and serving
FROM oven/bun:1 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build args for environment variables
ARG VITE_CONVEX_URL=http://127.0.0.1:3210
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

# Build the app
RUN bun run build

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install serve for static file serving
RUN bun add serve

# Expose port
EXPOSE 5173

# Start the server
CMD ["bunx", "serve", "dist", "-p", "5173", "-s"]