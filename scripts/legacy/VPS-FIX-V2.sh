#!/bin/bash
# VPS Deployment Fix v2 - Execute this remotely on the VPS
# Target: 187.124.217.8

set -e

echo "========================================"
echo "  TuckInn VPS Emergency Repair"
echo "  $(date)"
echo "========================================"

VPS_PATH="/opt/tuckinn/platform"

log() { echo "[$(date +%H:%M:%S)] $1"; }
success() { echo "[✓] $1"; }
warn() { echo "[WARN] $1"; }
error() { echo "[ERROR] $1"; }

# Navigate to project
if [ ! -d "$VPS_PATH" ]; then
    error "Project directory not found at $VPS_PATH"
    exit 1
fi

cd "$VPS_PATH"
log "Working in: $(pwd)"

# Step 1: Check Docker is running
log "Step 1: Verifying Docker..."
if ! systemctl is-active --quiet docker; then
    warn "Docker not running, attempting to start..."
    systemctl start docker
    sleep 3
    if ! systemctl is-active --quiet docker; then
        error "Failed to start Docker"
        exit 1
    fi
fi
success "Docker is running"

# Step 2: Check current container status
log "Step 2: Checking current containers..."
cd "$VPS_PATH/infra/docker"
docker compose -f docker-compose.prod.yml ps

# Step 3: Full stack restart
log "Step 3: Performing full stack restart..."
cd "$VPS_PATH/infra/docker"

log "Stopping all containers..."
docker compose -f docker-compose.prod.yml down --timeout 30 2>&1 || true

log "Removing old containers..."
docker compose -f docker-compose.prod.yml rm -f 2>&1 || true

log "Pulling latest images if needed..."
docker compose -f docker-compose.prod.yml pull 2>&1 || true

log "Starting postgres and redis first..."
docker compose -f docker-compose.prod.yml up -d postgres redis

log "Waiting for database to be ready (30 seconds)..."
sleep 30

# Wait for postgres to accept connections
POSTGRES_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q postgres 2>/dev/null || echo"")
if [ -n "$POSTGRES_CONTAINER" ]; then
    for i in $(seq 1 20); do
        if docker exec "$POSTGRES_CONTAINER" pg_isready -U tuckinn -d tuckinn_platform >/dev/null 2>&1; then
            success "PostgreSQL is ready"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
fi

log "Starting API..."
docker compose -f docker-compose.prod.yml up -d api
sleep 15

log "Starting frontends..."
docker compose -f docker-compose.prod.yml up -d admin staff storefront
sleep 10

log "Starting Caddy reverse proxy..."
docker compose -f docker-compose.prod.yml up -d caddy
sleep 5

# Step 4: Verify restart
log "Step 4: Verifying restart..."
docker compose -f docker-compose.prod.yml ps

# Step 5: Container health check
log "Step 5: Checking container health..."
sleep 5

API_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q api 2>/dev/null || echo"")
if [ -n "$API_CONTAINER" ]; then
    log "Testing API health..."
    docker exec "$API_CONTAINER" node -e "
        fetch('http://127.0.0.1:3200/api/health')
            .then(r => r.json())
            .then(d => console.log('HEALTH_RESULT:', JSON.stringify(d)))
            .catch(e => console.log('HEALTH_ERROR:', e.message))
    " 2>&1 || warn "Health check command failed"
else
    warn "API container not found"
fi

# Step 6: Summary
log "Step 6: Final status check..."
echo ""
echo "========================================"
echo "  Container Status Summary"
echo "========================================"

cd "$VPS_PATH/infra/docker"
for service in postgres redis api admin staff storefront caddy; do
    CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q "$service" 2>/dev/null || echo"")
    if [ -n "$CONTAINER" ]; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "unknown")
        success "$service: $STATUS"
    else
        warn "$service: NOT RUNNING"
    fi
done

echo ""
echo "========================================"
echo "  Repair Complete"
echo "========================================"
echo ""
echo "Test your application at:"
echo "  https://powder-fallen-add-museums.trycloudflare.com"
echo ""
echo "If API is still failing, check logs:"
echo "  docker compose -f docker-compose.prod.yml logs api"
echo ""
