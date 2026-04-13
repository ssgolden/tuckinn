#!/bin/sh
set -eu

LOG_LEVEL="${LOG_LEVEL:-info}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

log() {
  local level="$1"
  shift
  local msg="$*"
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  printf '{"level":"%s","ts":"%s","msg":"%s"}\n' "$level" "$ts" "$msg" >&2
}

log info "Tuckinn API entrypoint starting (log_level=$LOG_LEVEL)"

# --- Prisma migrations ---
log info "Applying Prisma migrations..."
if npx prisma migrate deploy --schema ./prisma/schema.prisma 2>&1; then
  log info "Prisma migrations applied successfully"
else
  log error "Prisma migration failed"
  exit 1
fi

# --- Database seeding ---
log info "Seeding database if needed..."
if npx tsx ../../prisma/seed.ts 2>/dev/null || node ./prisma/seed.js 2>/dev/null; then
  log info "Seed completed"
else
  log warn "Seed skipped (already seeded or not available)"
fi

# --- Start API ---
log info "Starting Tuckinn API on port ${PORT:-3200}..."
exec node ./apps/api/dist/main.js