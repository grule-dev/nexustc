# ---- Base image ----
FROM node:20-bookworm AS base

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ---- Fetch dependencies ----
FROM base AS deps

# Copy only the lockfile first to fetch packages into pnpm store
COPY pnpm-lock.yaml ./

# Fetch packages into the store (cached layer)
RUN pnpm fetch

# ---- Build ----
FROM deps AS build

# Copy all source files
COPY . .

# Install from the cached store (creates proper symlinks)
# Include devDependencies since turbo is needed for build
RUN pnpm install --offline --frozen-lockfile

# Build the application
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN pnpm run build

# ---- Runtime ----
FROM node:20-bookworm-slim AS runner

# Sharp runtime deps only
RUN apt-get update && apt-get install -y \
  libvips42 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=""

# Copy the built output (TanStack Start bundles to .output)
COPY --from=build /app/apps/web/.output ./apps/web/.output

# Copy production node_modules if needed for runtime dependencies
COPY --from=build /app/node_modules ./node_modules

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
