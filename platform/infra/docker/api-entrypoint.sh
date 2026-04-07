#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma

echo "Starting Tuckinn API on port ${PORT:-3200}..."
exec node ./apps/api/dist/main.js
