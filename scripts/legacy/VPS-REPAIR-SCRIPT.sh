#!/bin/bash
# VPS Repair Script for TuckInn Platform
# Run this on the VPS (187.124.217.8) to diagnose and fix issues

set -e

echo "======================================"
echo "  TuckInn VPS Repair Script"
echo "  Date: $(date)"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VPS_PATH="/opt/tuckinn/platform"

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Check Docker status
echo ""
info "Step 1: Checking Docker status..."
if ! systemctl is-active --quiet docker; then
    warn "Docker is not running. Starting Docker..."
    systemctl start docker
    sleep 2
fi
info "Docker is running"

# Step 2: Navigate to project
echo ""
info "Step 2: Checking project directory..."
if [ ! -d "$VPS_PATH" ]; then
    error "Project directory not found at $VPS_PATH"
    exit 1
fi
cd "$VPS_PATH/infra/docker"
info "Working in $(pwd)"

# Step 3: Check current container status
echo ""
info "Step 3: Checking current container status..."
docker compose -f docker-compose.prod.yml ps || true

# Step 4: Check for unhealthy containers
echo ""
info "Step 4: Checking container health..."
UNHEALTHY=$(docker compose -f docker-compose.prod.yml ps -q | xargs -I {} docker inspect --format='{{.Name}}: {{.State.Status}}' {} 2>/dev/null | grep -v "running" || true)
if [ -n "$UNHEALTHY" ]; then
    warn "Unhealthy containers found:"
    echo "$UNHEALTHY"
else
    info "All containers appear to be running"
fi

# Step 5: Check logs for critical errors
echo ""
info "Step 5: Checking API logs for critical errors..."
docker compose -f docker-compose.prod.yml logs --tail=50 api 2>&1 | head -50 || warn "Could not retrieve API logs"

# Step 6: Check database connectivity
echo ""
info "Step 6: Checking database connectivity..."
DB_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q postgres 2>/dev/null || echo "")
if [ -n "$DB_CONTAINER" ]; then
    if docker exec "$DB_CONTAINER" pg_isready -U tuckinn -d tuckinn_platform >/dev/null 2>&1; then
        info "Database is accepting connections"
    else
        warn "Database is not accepting connections"
    fi
else
    warn "Postgres container not found"
fi

# Step 7: Check Redis connectivity
echo ""
info "Step 7: Checking Redis..."
REDIS_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q redis 2>/dev/null || echo "")
if [ -n "$REDIS_CONTAINER" ]; then
    if docker exec "$REDIS_CONTAINER" redis-cli ping >/dev/null 2>&1; then
        info "Redis is responding"
    else
        warn "Redis is not responding"
    fi
else
    warn "Redis container not found"
fi

# Step 8: Test API health endpoint from inside the network
echo ""
info "Step 8: Testing API health..."
API_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q api 2>/dev/null || echo "")
if [ -n "$API_CONTAINER" ]; then
    HEALTH_RESULT=$(docker exec "$API_CONTAINER" node -e "
        fetch('http://127.0.0.1:3200/api/health')
            .then(r => r.json())
            .then(d => console.log('HEALTH_OK:', JSON.stringify(d)))
            .catch(e => console.log('HEALTH_ERROR:', e.message))
    " 2>&1 || echo "Health check failed")
    
    if echo "$HEALTH_RESULT" | grep -q "HEALTH_OK"; then
        info "API health check passed: $HEALTH_RESULT"
    else
        error "API health check failed: $HEALTH_RESULT"
    fi
else
    warn "API container not found"
fi

# Step 9: Rebuild and restart if needed
echo ""
info "Step 9: Checking if rebuild is needed..."
info "To force a rebuild of all services, run:"
echo "  cd $VPS_PATH/infra/docker"
echo "  docker compose -f docker-compose.prod.yml down"
echo "  docker compose -f docker-compose.prod.yml up -d --build"

# Step 10: Restart Caddy if needed
echo ""
info "Step 10: Checking Caddy..."
CADDY_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q caddy 2>/dev/null || echo "")
if [ -n "$CADDY_CONTAINER" ]; then
    if docker exec "$CADDY_CONTAINER" caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
        info "Caddy config is valid"
    else
        warn "Caddy config validation failed"
        docker compose -f docker-compose.prod.yml logs --tail=20 caddy
    fi
else
    warn "Caddy container not found"
fi

# Step 11: Verify environment files
echo ""
info "Step 11: Checking environment files..."
if [ ! -f "$VPS_PATH/.env.production" ]; then
    error "Missing .env.production file!"
else
    info ".env.production exists"
    # Check if critical vars are set
    if ! grep -q "DATABASE_URL" "$VPS_PATH/.env.production"; then
        warn "DATABASE_URL not found in .env.production"
    fi
    if ! grep -q "JWT_ACCESS_SECRET" "$VPS_PATH/.env.production"; then
        warn "JWT_ACCESS_SECRET not found in .env.production"
    fi
fi

# Summary
echo ""
echo "======================================"
echo "  Diagnostic Summary"
echo "======================================"
echo ""
echo "Services:"
for service in postgres redis api admin staff storefront caddy; do
    STATUS=$(docker compose -f docker-compose.prod.yml ps "$service" --format="{{.State.Status}}" 2>/dev/null || echo "not found")
    if [ "$STATUS" = "running" ]; then
        echo -e "  ✅ $service: $STATUS"
    else
        echo -e "  ❌ $service: $STATUS"
    fi
done

echo ""
echo "Next steps if issues found:"
echo "  1. Check logs: docker compose -f docker-compose.prod.yml logs -f <service>"
echo "  2. Restart specific service: docker compose -f docker-compose.prod.yml restart <service>"
echo "  3. Full rebuild: docker compose -f docker-compose.prod.yml up -d --build --no-deps <service>"
echo "  4. Database console: docker exec -it tuckinn-platform-postgres-1 psql -U tuckinn -d tuckinn_platform"
echo ""
echo "======================================"
echo "  Repair script completed!"
echo "======================================"
