#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${PLATFORM_ROOT}/.env.production"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo ".env.production is missing."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

check_url() {
  local name="$1"
  local url="$2"

  echo "[smoke] checking ${name}: ${url}"
  curl --fail --silent --show-error --location --max-time 20 "${url}" >/dev/null
}

check_url "api health" "https://${API_DOMAIN}/api/health"
check_url "storefront" "https://${STORE_DOMAIN}"
check_url "admin" "https://${ADMIN_DOMAIN}"
check_url "staff" "https://${STAFF_DOMAIN}"

echo "[smoke] all checks passed"
