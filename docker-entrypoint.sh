#!/bin/sh
# docker-entrypoint.sh — prepares the DB then starts the API.
#   1. Run migrations (creates schema + loads Ward One data)
#   2. Seed/refresh the admin user (idempotent)
#   3. Start the Express server
#
# Safe to run on every container restart — all operations are idempotent.
set -e

echo "=== 1/3 Running database migrations ==="
node dist/db/migrate.js || {
  echo "!!! Migration failed. Continuing anyway — server may fail to start."
}

echo "=== 2/3 Seeding admin user ==="
node dist/db/seed-admin.js || {
  echo "!!! Admin seed failed. Continuing anyway."
}

echo "=== 3/3 Starting API server ==="
exec "$@"
