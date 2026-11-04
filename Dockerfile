# backend/Dockerfile — multi-stage build for the Express + TypeScript API
# Used by Dokploy. Builds with Node 20, runs the compiled JS.
FROM node:20-slim AS builder
WORKDIR /app

# Copy package.json. We deliberately do NOT copy package-lock.json —
# we always run a fresh `npm install` so the build never fails due to
# a stale or missing lockfile. (Slightly slower, but bulletproof.)
COPY package.json ./
RUN npm install --no-audit --no-fund

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Production image ---
FROM node:20-slim AS runner
WORKDIR /app

# Only production deps — same fresh install approach
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Compiled output + migrations
COPY --from=builder /app/dist ./dist
COPY migrations ./migrations

# Entrypoint: runs migrations then starts the server
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
