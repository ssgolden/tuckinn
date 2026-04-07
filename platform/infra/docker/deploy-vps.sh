#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${PLATFORM_ROOT}"

if [[ ! -f ".env.production" ]]; then
  echo ".env.production is missing. Copy .env.production.example first."
  exit 1
fi

docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml pull
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml build
docker compose --env-file .env.production -f infra/docker/docker-compose.prod.yml up -d

echo "Tuckinn production stack deployed."
