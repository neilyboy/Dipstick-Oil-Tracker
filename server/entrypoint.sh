#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/server
npx prisma db push --skip-generate

echo "Starting Dipstick server..."
exec node /app/server/dist/index.js
