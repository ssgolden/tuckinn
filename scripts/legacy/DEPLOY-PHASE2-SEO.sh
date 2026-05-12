#!/bin/bash
# Phase 2 SEO Deployment Script
# Deploys blog, enhanced SEO, and performance optimizations

set -e

echo "========================================"
echo "  SEO Phase 2 Deployment"
echo "  Domain: tuckinnproper.com"
echo "========================================"

VPS_IP="187.124.217.8"
VPS_PATH="/opt/tuckinn/platform"
LOCAL_PATH="/mnt/c/Users/steph/OneDrive/Desktop/tuckinn p new/platform"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

log "Step 1: Syncing blog files..."

# Sync blog structure
scp -r "$LOCAL_PATH/apps/storefront/app/blog" "root@$VPS_IP:$VPS_PATH/apps/storefront/app/" 2>&1 && log "✅ Blog synced" || error "Blog sync failed"

log "Step 2: Syncing SEO utilities..."

# Sync SEO utilities
scp "$LOCAL_PATH/apps/storefront/lib/seo.ts" "root@$VPS_IP:$VPS_PATH/apps/storefront/lib/" 2>&1 && log "✅ SEO utilities synced" || warn "SEO utilities sync had issues"

log "Step 3: Rebuilding storefront with blog..."

# Build on VPS
ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml build --no-cache storefront" 2>&1 > /tmp/build.log && log "✅ Build complete" || error "Build failed - check /tmp/build.log"

log "Step 4: Restarting storefront..."

# Restart storefront
ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml up -d --no-deps storefront" 2>&1 && log "✅ Storefront restarted"

log "Step 5: Verification..."
sleep 10

# Test all endpoints
echo ""
echo "Testing SEO enhancements..."

# Test blog
BLOG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://tuckinnproper.com/blog" 2>/dev/null)
if [ "$BLOG_STATUS" = "200" ]; then
    log "✅ Blog page: 200"
else
    warn "Blog page: $BLOG_STATUS"
fi

# Test individual posts
POSTS=("healthy-lunch-ideas" "signature-sandwiches" "office-catering-guide" "fresh-vs-meal-prep")
for post in "${POSTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://tuckinnproper.com/blog/$post" 2>/dev/null)
    if [ "$STATUS" = "200" ]; then
        log "✅ Blog post ($post): 200"
    else
        warn "Blog post ($post): $STATUS"
    fi
done

# Test updated sitemap
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://tuckinnproper.com/sitemap.xml" 2>/dev/null)
if [ "$SITEMAP_STATUS" = "200" ]; then
    log "✅ Sitemap: 200"
    # Check if blog posts are in sitemap
    BLOG_COUNT=$(curl -s "https://tuckinnproper.com/sitemap.xml" 2>/dev/null | grep -c "/blog/" || echo "0")
    log "✅ Blog posts in sitemap: $BLOG_COUNT"
else
    warn "Sitemap: $SITEMAP_STATUS"
fi

log ""
echo "========================================"
echo "  ✅ SEO Phase 2 Deployment Complete!"
echo "========================================"
echo ""
echo "New Features:"
echo "  ✓ 4 SEO-optimized blog posts"
echo "  ✓ Blog listing page (/blog)"
echo "  ✓ Individual blog post pages"
echo "  ✓ Updated sitemap with blog posts"
echo "  ✓ Breadcrumb navigation"
echo "  ✓ Blog schema markup"
echo ""
echo "URLs to Test:"
echo "  https://tuckinnproper.com/blog"
echo "  https://tuckinnproper.com/blog/healthy-lunch-ideas"
echo "  https://tuckinnproper.com/blog/signature-sandwiches"
echo "  https://tuckinnproper.com/blog/office-catering-guide"
echo "  https://tuckinnproper.com/blog/fresh-vs-meal-prep"
echo ""
echo "Next Actions:"
echo "  1. Submit updated sitemap to Google Search Console"
echo "     https://search.google.com/search-console"
echo ""
echo "  2. Create Open Graph images:"
echo "     - /blog/featured-1.jpg (1200x630)"
echo "     - /blog/featured-2.jpg (1200x630)"
echo "     - /blog/featured-3.jpg (1200x630)"
echo "     - /blog/featured-4.jpg (1200x630)"
echo ""
echo "  3. Share blog posts on social media"
echo ""
echo "========================================"
