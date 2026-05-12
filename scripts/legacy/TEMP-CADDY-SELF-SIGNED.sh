#!/bin/bash
# Temporary Caddyfile with self-signed certificates for immediate testing
# This allows access before DNS is configured

VPS_PATH="/opt/tuckinn/platform"
cd "$VPS_PATH/infra/docker"

# Stop Caddy
docker compose -f docker-compose.prod.yml stop caddy

# Create temporary Caddyfile with tls internal (self-signed)
cat > Caddyfile << 'EOF'
# Temporary self-signed certificates for testing
# Use this until DNS is properly configured

tuckinnproper.com {
    tls internal
    encode gzip zstd
    
    handle /api/* {
        reverse_proxy api:3200
    }
    
    handle /uploads/* {
        reverse_proxy api:3200
    }
    
    reverse_proxy storefront:3000
    
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        -Server
    }
}

api.tuckinnproper.com {
    tls internal
    encode gzip zstd
    reverse_proxy api:3200
}

admin.tuckinnproper.com {
    tls internal
    encode gzip zstd
    
    handle /api/* {
        reverse_proxy api:3200
    }
    
    reverse_proxy admin:3000
}

staff.tuckinnproper.com {
    tls internal
    encode gzip zstd
    
    handle /api/* {
        reverse_proxy api:3200
    }
    
    reverse_proxy staff:3000
}

www.tuckinnproper.com {
    tls internal
    redir https://tuckinnproper.com{uri}
}
EOF

# Validate Caddyfile
docker run --rm -v "$(pwd)/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2.10 caddy validate --config /etc/caddy/Caddyfile

# Start Caddy
docker compose -f docker-compose.prod.yml up -d caddy

echo ""
echo "========================================"
echo "  Temporary Self-Signed SSL Enabled"
echo "========================================"
echo ""
echo "Caddy is now using self-signed certificates."
echo ""
echo "You can access via the VPS IP with the domains in your hosts file:"
echo ""
echo "Add to your local /etc/hosts or C:\Windows\System32\drivers\etc\hosts:"
echo "  187.124.217.8 tuckinnproper.com"
echo "  187.124.217.8 api.tuckinnproper.com"
echo "  187.124.217.8 admin.tuckinnproper.com"
echo "  187.124.217.8 staff.tuckinnproper.com"
echo "  187.124.217.8 www.tuckinnproper.com"
echo ""
echo "Then access: https://tuckinnproper.com (accept the SSL warning)"
echo ""
echo "========================================"
