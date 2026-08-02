#!/bin/sh
set -e

echo "Waiting for database to be ready..."
cd /app/server
until node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss; do
  echo "Database not ready, retrying in 3s..."
  sleep 3
done

echo "Database migration complete. Starting Dipstick server..."
exec node /app/server/dist/index.js
