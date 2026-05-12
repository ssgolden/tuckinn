# WhatsApp Badge Fix Plan

## Problem
Current WhatsApp button is:
- ❌ Too large (massive logo)
- ❌ Not floating properly
- ❌ Wrong position/display
- ❌ Not the standard WhatsApp business badge style

## Solution
Create proper floating WhatsApp badge:
- ✅ Small circular badge (56px)
- ✅ Fixed position (bottom-right)
- ✅ WhatsApp green color
- ✅ WhatsApp icon only (clean)
- ✅ Proper z-index (always on top)
- ✅ Hover effect (scale up slightly)
- ✅ Mobile responsive

## Phone Number Update
- Old: 1234567890 (placeholder)
- New: +34 627 755 609 (Spain)
- Format for wa.me: 34627755609

## Files to Modify
1. `components/WhatsAppButton.tsx` - Complete rewrite
2. `app/layout.tsx` - Keep import, ensure proper placement

## Deployment
- Build storefront
- Deploy to VPS
- Verify on mobile and desktop
