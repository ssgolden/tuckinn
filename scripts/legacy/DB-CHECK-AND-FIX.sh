#!/bin/bash
# Check and fix database credentials

VPS_PATH="/opt/tuckinn/platform"
cd "$VPS_PATH/infra/docker"

echo "Checking database status..."

POSTGRES_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q postgres)

# Check if user exists
echo "Checking if 'tuckinn' user exists..."
docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -c "\du" 2>&1 || docker exec -i "$POSTGRES_CONTAINER" psql -c "\du" 2>&1

# Verify database exists
echo "Checking databases..."
docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -c "\l" 2>&1 | head -20

# Get password from env
DB_PASSWORD=$(grep POSTGRES_PASSWORD "$VPS_PATH/.env.production" | cut -d= -f2)

echo ""
echo "Resetting password for 'tuckinn' user..."

# Set password
docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -c "ALTER USER tuckinn WITH PASSWORD '$DB_PASSWORD';" 2& || {
    echo "Trying with different superuser..."
    docker exec -i "$POSTGRES_CONTAINER" psql -c "ALTER USER tuckinn WITH PASSWORD '$DB_PASSWORD';" 2>&1
}

echo ""
echo "Verifying connection with correct user..."
docker exec -i "$POSTGRES_CONTAINER" psql -U tuckinn -d tuckinn_platform -c "SELECT 1 as test;" 2>&1

echo ""
echo "Restarting API container with fresh environment..."
docker compose -f docker-compose.prod.yml stop api
docker compose -f docker-compose.prod.yml rm -f api
docker compose -f docker-compose.prod.yml up -d api

echo ""
echo "Waiting 10 seconds..."
sleep 10

echo ""
echo "Checking API status..."
docker compose -f docker-compose.prod.yml ps api
docker compose -f docker-compose.prod.yml logs api --tail=30
