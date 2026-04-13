#!/bin/sh
set -eu

LOG_LEVEL="${LOG_LEVEL:-info}"

log() {
  local level="$1"; shift
  local msg="$*"
  local ts; ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  printf '{"level":"%s","ts":"%s","msg":"%s"}\n' "$level" "$ts" "$msg" >&2
}

log info "Tuckinn API entrypoint starting (log_level=$LOG_LEVEL)"

# --- Fix upload volume permissions (runs as root) ---
mkdir -p /app/data/uploads
chown -R 1001:1001 /app/data/uploads 2>/dev/null || true
chmod -R 775 /app/data/uploads 2>/dev/null || true

# --- Drop to appuser for all subsequent operations ---
log info "Dropping privileges to appuser (uid 1001)"
export HOME=/home/appuser

# --- Execute as appuser ---
exec gosu appuser:appgroup /bin/sh -c '
  set -e
  LOG_LEVEL="${LOG_LEVEL:-info}"

  # --- Prisma migrations ---
  echo "{\"level\":\"info\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"msg\":\"Applying Prisma migrations...\"}" >&2
  if npx prisma migrate deploy --schema ./prisma/schema.prisma 2>&1; then
    echo "{\"level\":\"info\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"msg\":\"Prisma migrations applied successfully\"}" >&2
  else
    echo "{\"level\":\"error\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"msg\":\"Prisma migration failed\"}" >&2
    exit 1
  fi

  # --- Database seeding ---
  echo "{\"level\":\"info\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"msg\":\"Seeding database if needed...\"}" >&2
  if npx tsx ../../prisma/seed.ts 2>/dev/null || node ./prisma/seed.js 2>/dev/null; then
    echo "{\"level\":\"info\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"msg\":\"Seed completed\"}" >&2
  else
    echo "{\"level\":\"warn\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"msg\":\"Seed skipped (already seeded or not available)\"}" >&2
  fi

  # --- Start API ---
  echo "{\"level\":\"info\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"msg\":\"Starting Tuckinn API on port ${PORT:-3200}...\"}" >&2
  exec node ./apps/api/dist/main.js
'