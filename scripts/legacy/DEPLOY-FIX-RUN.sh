#!/bin/bash
# Automated TuckInn VPS Deployment Fix
# This script syncs local fixes and redeploys to VPS

set -e

echo "========================================"
echo "  TuckInn VPS Deployment Fix"
echo "  Target: root@187.124.217.8"
echo "========================================"

VPS_IP="187.124.217.8"
VPS_PATH="/opt/tuckinn/platform"
LOCAL_PATH="/mnt/c/Users/steph/OneDrive/Desktop/tuckinn p new/platform"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step=0
step() { ((step++)); echo ""; echo -e "${GREEN}[$step]${NC} $1"; }
warn() { echo -e "${YELLOW}WARNING:${NC} $1"; }
error() { echo -e "${RED}ERROR:${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }

# Step 1: Pre-deployment check
step "Pre-deployment checks..."
if [ ! -d "$LOCAL_PATH" ]; then
    error "Local path not found: $LOCAL_PATH"
    exit 1
fi

# Check if we can connect to VPS
if ! ping -c 1 -W 5 $VPS_IP > /dev/null 2>&1; then
    warn "VPS ping failed, but will attempt SSH anyway..."
fi

# Step 2: Sync critical files
step "Syncing critical files to VPS..."

# Sync config files
scp "$LOCAL_PATH/infra/docker/docker-compose.prod.yml" "root@$VPS_IP:$VPS_PATH/infra/docker/" 2>/dev/null || { error "Failed to sync docker-compose"; exit 1; }
scp "$LOCAL_PATH/infra/docker/Caddyfile" "root@$VPS_IP:$VPS_PATH/infra/docker/" 2>/dev/null || { error "Failed to sync Caddyfile"; exit 1; }

# Sync environment if needed (be careful with this!)
# scp "$LOCAL_PATH/.env.production" "root@$VPS_IP:$VPS_PATH/" 2>/dev/null || warn "Failed to sync .env.production"

success "Files synced"

# Step 3: Copy and run repair script
step "Copying repair script to VPS..."
scp "C:\\Users\\steph\\OneDrive\\Desktop\\tuckinn p new\\VPS-REPAIR-SCRIPT.sh" "root@$VPS_IP:/tmp/vps-repair.sh" 2>/dev/null || warn "Could not copy repair script"
ssh root@$VPS_IP "chmod +x /tmp/vps-repair.sh" 2>/dev/null || true

# Step 4: Restart services on VPS
step "Restarting services on VPS..."
ssh root@$VPS_IP << 'REMOTE_SCRIPT'
cd /opt/tuckinn/platform/infra/docker

echo "Stopping all services..."
docker compose -f docker-compose.prod.yml down --timeout 30 2>/dev/null || true

echo "Removing old containers..."
docker compose -f docker-compose.prod.yml rm -f 2>/dev/null || true

echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo "Waiting for services to start..."
sleep 15

echo "Checking service status..."
docker compose -f docker-compose.prod.yml ps

echo "Recent API logs..."
docker compose -f docker-compose.prod.yml logs --tail=20 api 2>/dev/null || echo "Could not retrieve API logs"

exit 0
REMOTE_SCRIPT

# Step 5: Verify deployment
step "Verifying deployment..."
sleep 10

echo ""
echo "Service Status:"

# Test via Cloudflare tunnel
TUNNEL_URL="https://powder-fallen-add-museums.trycloudflare.com"

STOREFRONT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$TUNNEL_URL/" 2>/dev/null || echo "failed")
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$TUNNEL_URL/api/health" 2>/dev/null || echo "failed")
API_CATALOG=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$TUNNEL_URL/api/catalog/public" 2>/dev/null || echo "failed")

echo -e "Storefront: $([ "$STOREFRONT_STATUS" = "200" ] && echo '✅ 200' || echo "❌ $STOREFRONT_STATUS")"
echo -e "API Health: $([ "$API_STATUS" = "200" ] && echo '✅ 200' || echo "❌ $API_STATUS")"
echo -e "API Catalog: $([ "$API_CATALOG" = "200" ] && echo '✅ 200' || echo "❌ $API_CATALOG")"

echo ""
if [ "$API_STATUS" = "200" ]; then
    echo "Deployment successful! 🎉"
    echo ""
    echo "Access your application:"
    echo "  Storefront: $TUNNEL_URL"
    echo "  API: $TUNNEL_URL/api"
else
    warn "Deployment may have issues. Run the repair script for detailed diagnostics:"
    echo "  ssh root@$VPS_IP"
    echo "  /tmp/vps-repair.sh"
fi

echo ""
echo "========================================"
echo "  Deployment Fix Complete"
echo "========================================"
