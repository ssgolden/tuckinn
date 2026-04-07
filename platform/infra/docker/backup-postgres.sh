#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PLATFORM_ROOT}/infra/docker/docker-compose.prod.yml"
ENV_FILE="${PLATFORM_ROOT}/.env.production"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo ".env.production is missing."
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-${PLATFORM_ROOT}/backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "${BACKUP_DIR}"

set -a
source "${ENV_FILE}"
set +a

OUTPUT_FILE="${BACKUP_DIR}/tuckinn_postgres_${TIMESTAMP}.sql.gz"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists --no-owner --no-privileges \
  | gzip > "${OUTPUT_FILE}"

find "${BACKUP_DIR}" -type f -name '*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "Backup written to ${OUTPUT_FILE}"
