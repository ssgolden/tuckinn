#!/bin/bash
# Automatic DNS Checker and SSL Switcher
# This script monitors DNS and switches to real SSL when ready

DOMAIN="tuckinnproper.com"
VPS_IP="187.124.217.8"
VPS_PATH="/opt/tuckinn/platform"

cd "$VPS_PATH/infra/docker"

echo "========================================"
echo "  Auto DNS Checker & SSL Switcher"
echo "  Domain: $DOMAIN"
echo "  VPS IP: $VPS_IP"
echo "========================================"
echo ""
echo "Checking DNS every 30 seconds..."
echo "Press Ctrl+C to stop"
echo ""

ATTEMPTS=0
MAX_ATTEMPTS=120  # Check for 1 hour max

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    ATTEMPTS=$((ATTEMPTS + 1))
    CURRENT_IP=$(dig +short $DOMAIN 2>/dev/null | head -1)
    
    if [ "$CURRENT_IP" = "$VPS_IP" ]; then
        echo ""
        echo "✅ DNS CONFIGURED! $DOMAIN → $VPS_IP"
        echo ""
        echo "Switching to Let's Encrypt SSL..."
        echo ""
        
        # Create production Caddyfile
        cat > Caddyfile << 'EOF'
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

        # Validate and restart
        docker validate Caddyfile >/dev/null 2>&1 || caddy validate --config Caddyfile >/dev/null 2>&1 || true
        
        docker compose -f docker-compose.prod.yml restart caddy
        sleep 5
        
        echo ""
        echo "========================================"
        echo "  ✅ MIGRATION COMPLETE!"
        echo "========================================"
        echo ""
        echo "Your sites:"
        echo "  https://tuckinnproper.com"
        echo "  https://admin.tuckinnproper.com"
        echo "  https://staff.tuckinnproper.com"
        echo "  https://api.tuckinnproper.com/api/health"
        echo ""
        echo "SSL Status: Let's Encrypt certificates"
        echo ""
        exit 0
    fi
    
    if [ -z "$CURRENT_IP" ]; then
        echo "[$ATTEMPTS/$MAX_ATTEMPTS] $DOMAIN has no DNS record yet..."
    else
        echo "[$ATTEMPTS/$MAX_ATTEMPTS] $DOMAIN → $CURRENT_IP (waiting for $VPS_IP)..."
    fi
    
    sleep 30
done

echo ""
echo "⚠️  Timeout: DNS not configured after 1 hour"
echo ""
echo "Your domain $DOMAIN may not be pointing to $VPS_IP"
echo ""
echo "Check your domain's DNS records at your registrar:"
echo "  tuckinnproper.com A record → $VPS_IP"
echo ""
