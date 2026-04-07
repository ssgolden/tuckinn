#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PLATFORM_ROOT}/infra/docker/docker-compose.prod.yml"
ENV_FILE="${PLATFORM_ROOT}/.env.production"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/backup.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo ".env.production is missing."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

echo "This will overwrite database '${POSTGRES_DB}'."
read -r -p "Type RESTORE to continue: " CONFIRM
if [[ "${CONFIRM}" != "RESTORE" ]]; then
  echo "Restore cancelled."
  exit 1
fi

gunzip -c "${BACKUP_FILE}" | docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "Restore complete."
