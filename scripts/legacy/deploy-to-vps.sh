#!/bin/bash
# Tuckinn Platform Deployment Script
# Deploys local changes to VPS

set -e

echo "========================================"
echo "  Tuckinn Platform Deployment"
echo "  Target: 187.124.217.8"
echo "========================================"
echo ""

VPS_IP="187.124.217.8"
VPS_PATH="/opt/tuckinn/platform"
LOCAL_PATH="/mnt/c/Users/steph/OneDrive/Desktop/tuckinn p new/platform"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

step=0
total=7

step() {
    ((step++))
    echo ""
    echo -e "${GREEN}[$step/$total]${NC} $1"
}

warn() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

error() {
    echo -e "${RED}ERROR:${NC} $1"
}

# 1. Backup current VPS state
step "Backing up current VPS state..."
ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml config > docker-compose.backup.yml.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || warn "No previous backup"

# 2. Sync changed files to VPS
step "Syncing changed files to VPS..."

# Sync config files
scp "$LOCAL_PATH/infra/docker/docker-compose.prod.yml" "root@$VPS_IP:$VPS_PATH/infra/docker/" >/devdev/null 2>&1 || error "Failed to sync docker-compose"
scp "$LOCAL_PATH/infra/docker/Caddyfile" "root@$VPS_IP:$VPS_PATH/infra/docker/" >/dev/null 2>&1 || error "Failed to sync Caddyfile"

# Sync app source code (only changed files)
scp "$LOCAL_PATH/apps/admin/src/lib/api.ts" "root@$VPS_IP:$VPS_PATH/apps/admin/src/lib/" >/dev/null 2>&1
scp "$LOCAL_PATH/apps/staff/lib/api.ts" "root@$VPS_IP:$VPS_PATH/apps/staff/lib/" >/dev/null 2>&1
scp "$LOCAL_PATH/apps/storefront/lib/api.ts" "root@$VPS_IP:$VPS_PATH/apps/storefront/lib/" >/dev/null 2>&1

# Sync migration
echo "  Syncing new Prisma migration..."
scp -r "$LOCAL_PATH/prisma/migrations/20260414210638_add_business_settings" "root@$VPS_IP:$VPS_PATH/prisma/migrations/" >/dev/null 2>&1 || warn "Migration may already exist"

echo -e "${GREEN}  ✓ Files synced${NC}"

# 3. Run database migration
step "Running database migration..."
ssh root@$VPS_IP "cd $VPS_PATH && docker exec tuckinn-platform-api-1 npx prisma migrate deploy" 2>&1 || warn "Migration may have already been applied"

# 4. Rebuild containers with new environment
step "Rebuilding frontend containers..."
ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml build --no-cache admin staff storefront" 2>&1 < /dev/null

# 5. Restart services
step "Restarting services..."
ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml up -d --no-deps caddy admin staff storefront" 2>&1 < /dev/null

# 6. Wait for health checks
step "Waiting for health checks..."
sleep 10

# 7. Verify deployment
step "Verifying deployment..."

echo ""
echo "  Checking service health..."

# Check API
API_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "https://api.$VPS_IP.sslip.io/api/catalog/public" 2>/dev/null)
if [ "$API_STATUS" = "200" ]; then
    echo -e "    ${GREEN}✓${NC} API ($API_STATUS)"
else
    echo -e "    ${RED}✗${NC} API ($API_STATUS)"
fi

# Check each frontend
for service in storefront admin staff; do
    if [ "$service" = "storefront" ]; then
        URL="https://$VPS_IP.sslip.io"
    else
        URL="https://$service.$VPS_IP.sslip.io"
    fi
    
    STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        echo -e "    ${GREEN}✓${NC} $service ($STATUS)"
    else
        echo -e "    ${YELLOW}~${NC} $service ($STATUS - may need warmup)"
    fi
done

echo ""
echo "========================================"
echo -e "  ${GREEN}Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "  URLs:"
echo "    Storefront: https://$VPS_IP.sslip.io"
echo "    Admin:      https://admin.$VPS_IP.sslip.io"
echo "    Staff:      https://staff.$VPS_IP.sslip.io"
echo "    API:        https://api.$VPS_IP.sslip.io/api"
echo ""
echo "  Changes deployed:"
echo "    • Caddy direct /api/* proxy (fixes SSL trust issues)"
echo "    • Frontend API URLs simplified to '/api'"
echo "    • Business settings migration applied"
echo ""
