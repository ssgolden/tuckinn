#!/bin/bash
# Deploy WhatsApp Button to TuckInn Storefront

set -e

echo "========================================"
echo "  Deploying WhatsApp Button"
echo "  Target: tuckinnproper.com"
echo "========================================"

VPS_IP="187.124.217.8"
VPS_PATH="/opt/tuckinn/platform"
LOCAL_PATH="/mnt/c/Users/steph/OneDrive/Desktop/tuckinn p new/platform"

echo ""
echo "Step 1: Syncing WhatsApp button component..."

# Sync the component
scp "$LOCAL_PATH/apps/storefront/components/WhatsAppButton.tsx" "root@$VPS_IP:$VPS_PATH/apps/storefront/components/" 2>&1

echo "✅ Component synced"

echo ""
echo "Step 2: Syncing updated layout..."

# Sync the layout with WhatsApp button
scp "$LOCAL_PATH/apps/storefront/app/layout.tsx" "root@$VPS_IP:$VPS_PATH/apps/storefront/app/" 2>&1

echo "✅ Layout synced"

echo ""
echo "Step 3: Building storefront..."

ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml build --no-cache storefront" 2>&1 | tail -20

echo "✅ Build complete"

echo ""
echo "Step 4: Restarting storefront..."

ssh root@$VPS_IP "cd $VPS_PATH/infra/docker && docker compose -f docker-compose.prod.yml up -d --no-deps storefront" 2>&1

echo "✅ Storefront restarted"

echo ""
echo "Step 5: Verification..."
sleep 5

# Check if site is still responding
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://tuckinnproper.com" 2>/dev/null)

if [ "$STATUS" = "200" ]; then
    echo "✅ Storefront responding (HTTP 200)"
else
    echo "⚠️  Storefront status: $STATUS"
fi

echo ""
echo "========================================"
echo "  ✅ WhatsApp Button Deployed!"
echo "========================================"
echo ""
echo "Features:"
echo "  ✓ Floating green WhatsApp button"
echo "  ✓ Bottom-right corner position"
echo "  ✓ Pulse animation for attention"
echo "  ✓ Hover to expand with 'Chat with us' text"
echo "  ✓ Pre-filled message: 'Hi! I'd like to place an order...'"
echo "  ✓ Mobile responsive"
echo ""
echo "IMPORTANT: Update phone number!"
echo "  Edit: $VPS_PATH/apps/storefront/components/WhatsAppButton.tsx"
echo "  Or locally: components/WhatsAppButton.tsx"
echo ""
echo "Current number: 1234567890 (placeholder)"
echo "Change to: YOUR-ACTUAL-WHATSAPP-NUMBER"
echo ""
echo "Format: Include country code, no spaces"
echo "Example: 15551234567 (for +1 555-123-4567)"
echo ""
echo "Test: https://tuckinnproper.com"
echo ""
echo "========================================"
