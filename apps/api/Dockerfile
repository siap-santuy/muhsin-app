# Production Dockerfile for MuhsinApp API (Bun + Hono)
FROM oven/bun:1-alpine AS base

WORKDIR /app

# Copy root package files and lockfile
COPY package.json bun.lock ./

# Copy packages and apps manifests
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies using bun workspace
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build shared package if needed
WORKDIR /app/apps/api

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["bun", "run", "src/index.ts"]
