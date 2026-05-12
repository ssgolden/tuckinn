#!/bin/bash
# Deploy SEO Optimizations to VPS

echo "========================================"
echo "  Deploying SEO Optimizations"
echo "  Target: tuckinnproper.com"
echo "========================================"

VPS_IP="187.124.217.8"
VPS_PATH="/opt/tuckinn/platform"
LOCAL_PATH="/mnt/c/Users/steph/OneDrive/Desktop/tuckinn p new/platform"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"; }

# Step 1: Sync SEO files
log "Step 1: Syncing SEO-optimized files..."

# Sync storefront
scp -r "$LOCAL_PATH/apps/storefront/app/layout.tsx" "root@$VPS_IP:$VPS_PATH/apps/storefront/app/"
scp -r "$LOCAL_PATH/apps/storefront/app/sitemap.ts" "root@$VPS_IP:$VPS_PATH/apps/storefront/app/"
scp -r "$LOCAL_PATH/apps/storefront/app/robots.ts" "root@$VPS_IP:$VPS_PATH/apps/storefront/app/"
scp -r "$LOCAL_PATH/apps/storefront/components/seo" "root@$VPS_IP:$VPS_PATH/apps/storefront/components/"
scp -r "$LOCAL_PATH/apps/storefront/lib/seo.ts" "root@$VPS_IP:$VPS_PATH/apps/storefront/lib/"
scp -r "$LOCAL_PATH/apps/storefront/public/manifest.json" "root@$VPS_IP:$VPS_PATH/apps/storefront/public/"

log "✅ Files synced"

# Step 2: Rebuild storefront
log "Step 2: Rebuilding storefront with SEO optimizations..."
ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml build --no-cache storefront" 2>&1

log "✅ Build complete"

# Step 3: Restart storefront
log "Step 3: Restarting storefront..."
ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml up -d --no-deps storefront" 2>&1

log "✅ Storefront restarted"

# Step 4: Verify deployment
log "Step 4: Verifying deployment..."
sleep 5

# Test sitemap
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://tuckinnproper.com/sitemap.xml" 2>/dev/null)
log "Sitemap: $SITEMAP_STATUS"

# Test robots.txt
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://tuckinnproper.com/robots.txt" 2>/dev/null)
log "Robots.txt: $ROBOTS_STATUS"

# Test manifest
MANIFEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://tuckinnproper.com/manifest.json" 2>/dev/null)
log "Manifest: $MANIFEST_STATUS"

# Test page
PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://tuckinnproper.com" 2>/dev/null)
log "Homepage: $PAGE_STATUS"

log ""
echo "========================================"
echo "  ✅ SEO Deployment Complete!"
echo "========================================"
echo ""
echo "New SEO features deployed:"
echo "  ✓ Structured data (Schema.org)"
echo "  ✓ XML Sitemap (auto-generated)"
echo "  ✓ Robots.txt optimization"
echo "  ✓ Enhanced meta tags"
echo "  ✓ Open Graph images"
echo "  ✓ Twitter Cards"
echo "  ✓ PWA manifest.json"
echo "  ✓ Canonical URLs"
echo ""
echo "Next steps:"
echo "  1. Submit sitemap to Google Search Console:"
echo "     https://search.google.com/search-console"
echo "  2. Verify site ownership"
echo "  3. Submit: https://tuckinnproper.com/sitemap.xml"
echo ""
echo "Test your SEO:"
echo "  - Sitemap: https://tuckinnproper.com/sitemap.xml"
echo "  - Robots: https://tuckinnproper.com/robots.txt"
echo "  - Manifest: https://tuckinnproper.com/manifest.json"
echo ""
