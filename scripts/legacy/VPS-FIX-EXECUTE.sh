#!/bin/bash
# VPS Deployment Fix - Execute this remotely on the VPS
# Target: 187.124.217.8

set -e

echo "========================================"
echo "  TuckInn VPS Emergency Repair"
echo "  $(date)"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }

VPS_PATH="/opt/tuckinn/platform"

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

# Step 3: Check for container errors
log "Step 3: Checking for critical errors..."

# Get last 50 lines of API logs
API_LOGS=$(docker compose -f docker-compose.prod.yml logs --tail=50 api 2>&1 || echo "")

# Check for common database connection errors
if echo "$API_LOGS" | grep -q "connection refused\|ECONNREFUSED\|database\|Prisma"; then
    warn "Database connection issues detected in API logs"
    DB_ISSUE=true
fi

if echo "$API_LOGS" | grep -q "error\|Error\|ERROR"; then
    warn "Errors found in API logs"
    echo "$API_LOGS" | tail -20
fi

# Step 4: Check database container
log "Step 4: Checking PostgreSQL..."
POSTGRES_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q postgres 2>/dev/null || echo "")

if [ -z "$POSTGRES_CONTAINER" ]; then
    warn "Postgres container not running"
    POSTGRES_HEALTHY=false
else
    if docker exec "$POSTGRES_CONTAINER" pg_isready -U tuckinn -d tuckinn_platform >/dev/null 2>&1; then
        success "PostgreSQL is accepting connections"
        POSTGRES_HEALTHY=true
    else
        warn "PostgreSQL is NOT accepting connections"
        POSTGRES_HEALTHY=false
        docker exec "$POSTGRES_CONTAINER" pg_isready -U tuckinn -d tuckinn_platform 2>&1 || true
    fi
fi

# Step 5: Check Redis
log "Step 5: Checking Redis..."
REDIS_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q redis 2>/dev/null || echo "")

if [ -z "$REDIS_CONTAINER" ]; then
    warn "Redis container not running"
else
    if docker exec "$REDIS_CONTAINER" redis-cli ping >/dev/null 2>&1; then
        success "Redis is responding"
    else
        warn "Redis is not responding"
    fi
fi

# Step 6: Check environment variables
log "Step 6: Verifying environment configuration..."
if [ -f "$VPS_PATH/.env.production" ]; then
    if grep -q "DATABASE_URL" "$VPS_PATH/.env.production"; then
        info "DATABASE_URL found in .env.production"
    else
        error "DATABASE_URL missing from .env.production"
    fi
    
    if grep -q "JWT_ACCESS_SECRET" "$VPS_PATH/.env.production"; then
        info "JWT_ACCESS_SECRET found"
    else
        error "JWT_ACCESS_SECRET missing"
    fi
else
    error ".env.production file not found"
fi

# Step 7: Restart strategy
log "Step 7: Executing repair..."

if [ "$POSTGRES_HEALTHY" = false ] || [ -n "$DB_ISSUE" ]; then
    warn "Database issues detected - performing full stack restart"
    
    log "Stopping all containers..."
    docker compose -f docker-compose.prod.yml down --timeout 30 2>/dev/null || true
    
    log "Removing any stuck containers..."
    docker compose -f docker-compose.prod.yml rm -f 2>/dev/null || true
    
    log "Starting services in dependency order..."
    docker compose -f docker-compose.prod.yml up -d postgres redis
    
    log "Waiting for database to be ready..."
    sleep 15
    
    # Wait for postgres
    for i in {1..30}; do
        if docker exec $(docker compose -f docker-compose.prod.yml ps -q postgres) pg_isready -U tuckinn -d tuckinn_platform >/dev/null 2>&1; then
            success "Postgres is ready"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    log "Starting API..."
    docker compose -f docker-compose.prod.yml up -d api
    sleep 10
    
    log "Starting frontends..."
    docker compose -f docker-compose.prod.yml up -d admin staff storefront
    sleep 5
    
    log "Starting Caddy (reverse proxy)..."
    docker compose -f docker-compose.prod.yml up -d caddy
    
else
    info "Database appears healthy, restarting API and frontends only..."
    docker compose -f docker-compose.prod.yml restart api
    sleep 5
    docker compose -f docker-compose.prod.yml restart admin staff storefront
    sleep 3
    docker compose -f docker-compose.prod.yml restart caddy
fi

# Step 8: Verify restart
log "Step 8: Verifying restart..."
sleep 10

docker compose -f docker-compose.prod.yml ps

# Step 9: Test endpoints
log "Step 9: Testing endpoints..."

# Health check via localhost from within network
API_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q api 2>/dev/null || echo "")
if [ -n "$API_CONTAINER" ]; then
    log "Testing API health from inside container..."
    HEALTH_TEST=$(docker exec "$API_CONTAINER" node -e "
        fetch('http://127.0.0.1:3200/api/health')
            .then(r => r.json())
            .then(d => console.log('SUCCESS:', JSON.stringify(d)))
            .catch(e => console.log('FAILED:', e.message))
    " 2>&1)
    
    if echo "$HEALTH_TEST" | grep -q "SUCCESS"; then
        success "API health check PASSED: $HEALTH_TEST"
    else
        error "API health check FAILED: $HEALTH_TEST"
        warn "Showing API logs:"
        docker compose -f docker-compose.prod.yml logs --tail=30 api
    fi
    
    # Test catalog endpoint
    CATALOG_TEST=$(docker exec "$API_CONTAINER" node -e "
        fetch('http://127.0.0.1:3200/api/catalog/public?locationCode=main')
            .then(r => r.status === 200 ? r.text() : Promise.reject('Status: ' + r.status))
            .then(d => console.log('CATALOG_SUCCESS'))
            .catch(e => console.log('CATALOG_FAILED:', e))
    " 2>&1)
    
    if echo "$CATALOG_TEST" | grep -q "CATALOG_SUCCESS"; then
        success "API catalog endpoint PASSED"
    else
        error "API catalog endpoint FAILED: $CATALOG_TEST"
    fi
else
    error "API container not found after restart"
fi

# Step 10: Summary
log "Step 10: Final status..."
echo ""
echo "========================================"
echo "  Container Status"
echo "========================================"

for service in postgres redis api admin staff storefront caddy; do
    CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q "$service" 2>/dev/null || echo "")
    if [ -n "$CONTAINER" ]; then
        STATUS=$(docker inspect --format='{{.State.Status}} ({{.State.Health.Status}})' "$CONTAINER" 2>/dev/null || echo "unknown")
        echo -e "  ✅ $service: $STATUS"
    else
        echo -e "  ❌ $service: NOT RUNNING"
    fi
done

echo ""
echo "========================================"
echo "  Fix Complete!"
echo "========================================"
echo ""
echo "Test your application:"
echo "  Tunnel: https://powder-fallen-add-museums.trycloudflare.com"
echo ""
echo "If issues persist, check logs with:"
echo "  docker compose -f docker-compose.prod.yml logs -f api"
echo ""
