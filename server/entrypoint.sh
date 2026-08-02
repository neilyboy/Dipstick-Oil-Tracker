#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until npx prisma db push --skip-generate --accept-data-loss 2>/dev/null; do
  echo "Database not ready, retrying in 3s..."
  sleep 3
done

echo "Database migration complete. Starting Dipstick server..."
exec node /app/server/dist/index.js
