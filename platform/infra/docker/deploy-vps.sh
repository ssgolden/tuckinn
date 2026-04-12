#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PLATFORM_ROOT}/infra/docker/docker-compose.prod.yml"
ENV_FILE="${PLATFORM_ROOT}/.env.production"
BACKUP_SCRIPT="${PLATFORM_ROOT}/infra/docker/backup-postgres.sh"
SMOKE_SCRIPT="${PLATFORM_ROOT}/infra/docker/smoke-check-prod.sh"
ROLLBACK_SHA_FILE="${ROLLBACK_SHA_FILE:-/tmp/tuckinn-predeploy-sha.txt}"
SKIP_BACKUP="${SKIP_BACKUP:-0}"
SKIP_SMOKE="${SKIP_SMOKE:-0}"
ALLOW_PLACEHOLDER_SECRETS="${ALLOW_PLACEHOLDER_SECRETS:-0}"

log() {
  printf '[deploy-vps] %s\n' "$*"
}

die() {
  printf '[deploy-vps] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

require_file() {
  [[ -f "$1" ]] || die "Required file not found: $1"
}

compose() {
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" "$@"
}

wait_for_health() {
  local service="$1"
  local timeout="${2:-120}"
  local elapsed=0
  local container_id
  local health

  container_id="$(compose ps -q "${service}")"
  [[ -n "${container_id}" ]] || die "No container id found for service '${service}'"

  while (( elapsed < timeout )); do
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || true)"
    case "${health}" in
      healthy|running)
        log "Service '${service}' is ${health}"
        return 0
        ;;
      unhealthy|exited|dead)
        compose logs --tail=100 "${service}" || true
        die "Service '${service}' entered bad state: ${health}"
        ;;
    esac

    sleep 2
    elapsed=$((elapsed + 2))
  done

  compose logs --tail=100 "${service}" || true
  die "Timed out waiting for service '${service}' health"
}

validate_env_file() {
  local required_keys=(
    STORE_DOMAIN
    ADMIN_DOMAIN
    STAFF_DOMAIN
    API_DOMAIN
    DATABASE_URL
    REDIS_URL
    POSTGRES_DB
    POSTGRES_USER
    POSTGRES_PASSWORD
    JWT_ACCESS_SECRET
    JWT_REFRESH_SECRET
    SESSION_SECRET
    SEED_ADMIN_EMAIL
    SEED_ADMIN_PASSWORD
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ALLOWED_ORIGINS
  )
  local key

  for key in "${required_keys[@]}"; do
    grep -q "^${key}=" "${ENV_FILE}" || die "Missing required env key: ${key}"
  done

  if [[ "${ALLOW_PLACEHOLDER_SECRETS}" != "1" ]]; then
    if grep -nE 'change-me|replace-me|replace-with-strong|sk_live_replace_me|pk_live_replace_me|whsec_replace_me' "${ENV_FILE}" >/dev/null; then
      die "Placeholder secret detected in ${ENV_FILE}. Set ALLOW_PLACEHOLDER_SECRETS=1 only if you intentionally want to bypass this guard."
    fi
  fi
}

record_rollback_sha() {
  if git rev-parse HEAD >/dev/null 2>&1; then
    git rev-parse HEAD > "${ROLLBACK_SHA_FILE}"
    log "Recorded rollback SHA to ${ROLLBACK_SHA_FILE}: $(cat "${ROLLBACK_SHA_FILE}")"
  else
    date -u +"filesync-%Y%m%dT%H%M%SZ" > "${ROLLBACK_SHA_FILE}"
    log "Recorded file-sync rollback marker to ${ROLLBACK_SHA_FILE}: $(cat "${ROLLBACK_SHA_FILE}")"
  fi
}

run_backup() {
  if [[ "${SKIP_BACKUP}" == "1" ]]; then
    log "Skipping PostgreSQL backup because SKIP_BACKUP=1"
    return 0
  fi

  chmod +x "${BACKUP_SCRIPT}"
  BACKUP_DIR="${BACKUP_DIR:-/var/backups/tuckinn}" "${BACKUP_SCRIPT}"
}

build_and_start_data_services() {
  log "Starting data services"
  compose up -d postgres redis
  wait_for_health postgres 120
  wait_for_health redis 120
}

build_images() {
  log "Pulling base images"
  compose pull || true

  log "Building application images"
  compose build api storefront admin staff
}

run_migrations() {
  log "Running Prisma migrations"
  compose run --rm api ./node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma
}

start_application_services() {
  log "Starting API and web applications"
  compose up -d api storefront admin staff caddy
  wait_for_health api 180
  wait_for_health storefront 180
  wait_for_health admin 180
  wait_for_health staff 180
}

run_smoke_checks() {
  if [[ "${SKIP_SMOKE}" == "1" ]]; then
    log "Skipping smoke checks because SKIP_SMOKE=1"
    return 0
  fi

  chmod +x "${SMOKE_SCRIPT}"
  "${SMOKE_SCRIPT}"
}

main() {
  require_command docker
  require_command curl
  require_file "${ENV_FILE}"
  require_file "${BACKUP_SCRIPT}"
  require_file "${SMOKE_SCRIPT}"

  cd "${PLATFORM_ROOT}"

  log "Validating production env"
  validate_env_file

  log "Recording current revision for rollback"
  record_rollback_sha

  log "Creating rollback backup"
  run_backup

  build_and_start_data_services
  build_images
  run_migrations
  start_application_services
  run_smoke_checks

  log "Tuckinn production stack deployed successfully."
}

main "$@"
