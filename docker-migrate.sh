#!/bin/sh
set -e

echo "==> Applying migrations..."
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

echo "==> Running seed..."
npx ts-node --transpile-only --project apps/api/tsconfig.app.json apps/api/prisma/seed.ts

echo "==> Done."
