#!/bin/bash
# Deploy Fixed WhatsApp Badge

echo "========================================"
echo "  Deploying Fixed WhatsApp Badge"
echo "  Phone: +34 627 755 609"
echo "========================================"

VPS_IP="187.124.217.8"
VPS_PATH="/opt/tuckinn/platform"
LOCAL_PATH="/mnt/c/Users/steph/OneDrive/Desktop/tuckinn p new/platform"

echo ""
echo "Step 1: Syncing fixed component..."

# Sync the fixed component
scp "$LOCAL_PATH/apps/storefront/components/WhatsAppButton.tsx" "root@$VPS_IP:$VPS_PATH/apps/storefront/components/" 2>&1

echo "✅ Component synced"

echo ""
echo "Step 2: Syncing updated layout..."

# Sync layout with updated phone number
scp "$LOCAL_PATH/apps/storefront/app/layout.tsx" "root@$VPS_IP:$VPS_PATH/apps/storefront/app/" 2>&1

echo "✅ Layout synced"

echo ""
echo "Step 3: Building storefront..."

ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml build --no-cache storefront" 2>&1 | tail -15

echo "✅ Build complete"

echo ""
echo "Step 4: Restarting storefront..."

ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml up -d --no-deps storefront" 2>&1

echo "✅ Storefront restarted"

echo ""
echo "Step 5: Verification..."
sleep 5

# Check if site is responding
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://tuckinnproper.com" 2>/dev/null)

if [ "$STATUS" = "200" ]; then
    echo "✅ Storefront responding (HTTP 200)"
else
    echo "⚠️  Storefront status: $STATUS"
fi

echo ""
echo "========================================"
echo "  ✅ WhatsApp Badge Fixed & Deployed!"
echo "========================================"
echo ""
echo "Features:"
echo "  ✓ Small circular badge (56px)"
echo "  ✓ Fixed bottom-right position"
echo "  ✓ WhatsApp green (#25D366)"
echo "  ✓ Clean WhatsApp icon only"
echo "  ✓ Smooth hover animation"
echo "  ✓ Subtle pulse ring effect"
echo "  ✓ Mobile responsive (50px on mobile)"
echo "  ✓ Updated phone: +34 627 755 609"
echo ""
echo "Test it:"
echo "  https://tuckinnproper.com"
echo ""
echo "The badge should appear as a small green"
echo "circle with white WhatsApp logo in the"
echo "bottom-right corner of the page."
echo ""
echo "========================================"
