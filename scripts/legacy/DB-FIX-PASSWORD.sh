#!/bin/bash
# Fix PostgreSQL password to match .env.production

VPS_PATH="/opt/tuckinn/platform"
cd "$VPS_PATH/infra/docker"

echo "Fixing PostgreSQL password..."

# Stop API to prevent connection attempts
docker compose -f docker-compose.prod.yml stop api

# Get postgres container
POSTGRES_CONTAINER=$(docker compose -f docker-compose.prod.yml ps -q postgres)

# Get the expected password from .env.production
DB_PASSWORD=$(grep POSTGRES_PASSWORD "$VPS_PATH/.env.production" | cut -d= -f2)

echo "Setting password for user 'tuckinn'..."

# Execute SQL to change password
docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -c "ALTER USER tuckinn WITH PASSWORD '$DB_PASSWORD';" 2>&1 || {
    echo "Trying as postgres superuser..."
    docker exec -i "$POSTGRES_CONTAINER" psql -U tuckinn -d postgres -c "ALTER USER tuckinn WITH PASSWORD '$DB_PASSWORD';" 2>&1
}

echo "Password updated. Testing connection..."
docker exec -i "$POSTGRES_CONTAINER" psql -U tuckinn -d tuckinn_platform -c "SELECT 1;" 2>&1 && {
    echo "Connection successful!"
} || {
    echo "Connection failed, trying alternative method..."
    # Create user if doesn't exist
    docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -c "
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tuckinn') THEN
                CREATE USER tuckinn WITH PASSWORD '$DB_PASSWORD';
                GRANT ALL PRIVILEGES ON DATABASE tuckinn_platform TO tuckinn;
                ALTER DATABASE tuckinn_platform OWNER TO tuckinn;
            END IF;
        END
        \$\$;
    " 2>&1
}

# Restart API
echo "Restarting API..."
docker compose -f docker-compose.prod.yml restart api

echo "Done! Check API logs:"
docker compose -f docker-compose.prod.yml logs api --tail=20
