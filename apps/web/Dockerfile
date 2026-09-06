# Multi-stage Dockerfile for MuhsinApp Web (Vite + Nginx)
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Build arguments for Vite
ARG VITE_API_URL=https://api.muhsin.id
ARG VITE_DEFAULT_SCHOOL_SLUG=alfitrah

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEFAULT_SCHOOL_SLUG=$VITE_DEFAULT_SCHOOL_SLUG

# Copy workspace package manifests
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build static bundle
WORKDIR /app/apps/web
RUN bun run build

# Production Static File Server via Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
