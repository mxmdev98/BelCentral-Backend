# backend/Dockerfile — multi-stage build for the Express + TypeScript API
# Used by Dokploy. Builds with Node 20, runs the compiled JS.
FROM node:20-slim AS builder
WORKDIR /app

# Install deps (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Production image ---
FROM node:20-slim AS runner
WORKDIR /app

# Only production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

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
