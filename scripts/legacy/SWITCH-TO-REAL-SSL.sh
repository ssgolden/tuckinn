#!/bin/bash
# Switch from self-signed to Let's Encrypt SSL certificates
# Run this after DNS is configured

VPS_PATH="/opt/tuckinn/platform"
cd "$VPS_PATH/infra/docker"

echo "========================================"
echo "  Switching to Let's Encrypt SSL"
echo "========================================"
echo ""

# Check if DNS is configured
DOMAIN="tuckinnproper.com"
CURRENT_IP=$(dig +short $DOMAIN | head -1)
VPS_IP="187.124.217.8"

if [ "$CURRENT_IP" != "$VPS_IP" ]; then
    echo "❌ DNS NOT YET CONFIGURED!"
    echo ""
    echo "Current DNS for $DOMAIN: $CURRENT_IP"
    echo "Expected IP: $VPS_IP"
    echo ""
    echo "Steps to fix:"
    echo "1. Configure DNS A records for tuckinnproper.com → $VPS_IP"
    echo "2. Wait 5-30 minutes for propagation"
    echo "3. Run this script again"
    echo ""
    exit 1
fi

echo "✅ DNS configured correctly: $CURRENT_IP"
echo ""

# Update Caddyfile to remove "tls internal"
cat > Caddyfile << 'EOF'
# TuckInn Platform - Caddyfile for tuckinnproper.com
# Using Let's Encrypt SSL (auto-generated)

tuckinnproper.com {
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
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        -Server
    }
}

api.tuckinnproper.com {
    encode gzip zstd
    reverse_proxy api:3200
    header {
        X-Content-Type-Options "nosniff"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        -Server
    }
}

admin.tuckinnproper.com {
    encode gzip zstd
    
    handle /api/* {
        reverse_proxy api:3200
    }
    
    reverse_proxy admin:3000
    
    header {
        X-Content-Type-Options "nosniff"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        -Server
    }
}

staff.tuckinnproper.com {
    encode gzip zstd
    
    handle /api/* {
        reverse_proxy api:3200
    }
    
    reverse_proxy staff:3000
    
    header {
        X-Content-Type-Options "nosniff"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        -Server
    }
}

www.tuckinnproper.com {
    redir https://tuckinnproper.com{uri}
}
EOF

echo "✅ Caddyfile updated (removed tls internal)"

# Restart Caddy to apply changes
echo ""
echo "Restarting Caddy..."
docker compose -f docker-compose.prod.yml restart caddy
sleep 5

echo ""
echo "========================================"
echo "  ✅ SSL Configuration Complete"
echo "========================================"
echo ""
echo "Your site will now use Let's Encrypt SSL certificates."
echo "This may take 1-2 minutes to obtain certificates."
echo ""
echo "Watch the logs to see certificate issuance:"
echo "  docker compose -f docker-compose.prod.yml logs -f caddy"
echo ""
echo "Test your site:"
echo "  https://tuckinnproper.com"
echo "  https://api.tuckinnproper.com/api/health"
echo "  https://admin.tuckinnproper.com"
echo "  https://staff.tuckinnproper.com"
echo ""
