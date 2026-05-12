# Storefront Icon Fix - Deployed

**Date**: 2026-04-14  
**Issue**: Material Icons showing as text instead of symbols  
**Status**: ✅ **FIXED**

---

## Root Cause

The **Content Security Policy (CSP)** headers in Caddy were blocking Google Fonts:

```
# BEFORE (blocked Google Fonts)
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
```

This prevented the Material Icons font from loading, causing the text content (e.g., "error_outline", "shopping_bag") to display instead of the actual icons.

---

## The Fix

Updated Caddyfile CSP headers to allow Google Fonts:

```
# AFTER (allows Google Fonts)
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;
font-src 'self' data: https://fonts.gstatic.com;
```

Also added `/uploads/*` proxy route for product images.

---

## Changes Made

### Caddyfile (`infra/docker/Caddyfile`)

1. **CSP Headers** - Added Google Fonts domains:
   - `https://fonts.googleapis.com` (stylesheets)
   - `https://fonts.gstatic.com` (font files)

2. **Uploads Proxy** - Added route for product images:
   ```
   handle /uploads/* {
       reverse_proxy api:3200
   }
   ```

---

## Verification

**Caddy restarted**: ✅ Container restarted successfully  
**CSP updated**: ✅ Headers now include Google Fonts  
**Storefront**: ✅ Healthy and responding 200

**Test it now**:
```bash
# View CSP header
curl -I https://187.124.217.8.sslip.io/ | grep content-security-policy

# Should show:
# style-src ... https://fonts.googleapis.com https://fonts.gstatic.com
# font-src ... https://fonts.gstatic.com
```

---

## Icons That Were Broken (Now Fixed)

| Icon Name | Text Showing | Category |
|-----------|--------------|----------|
| `lunch_dining` | "lunch_dining" | Sandwiches |
| `bakery_dining` | "bakery_dining" | Breakfast |
| `local_cafe` | "local_cafe" | Drinks |
| `sell` | "sell" | Deals |
| `restaurant` | "restaurant" | Default |
| `error_outline` | "error_outline" | Error states |
| `shopping_bag` | "shopping_bag" | Basket |
| `check_circle` | "check_circle" | Success |
| `restaurant_menu` | "restaurant_menu" | Menu |

---

## Testing

1. **Visit**: https://187.124.217.8.sslip.io/
2. **Check icons** - Should see actual icons, not text descriptions
3. **Mobile menu rail** - Category icons should render properly
4. **Basket icon** - Shopping bag should display as icon
5. **Product images** - Should load from `/uploads/` path

---

## If Icons Still Don't Show

**Browser Cache**: Try hard refresh:
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**DevTools Check**:
1. Open DevTools → Network tab
2. Reload page
3. Look for `fonts.googleapis.com` requests
4. Check they return 200 (not blocked)

---

## Credentials (unchanged)

**Storefront**: https://187.124.217.8.sslip.io/

---

## Command Reference

```bash
# View storefront logs
ssh root@187.124.217.8 "docker logs -f tuckinn-platform-storefront-1"

# Restart Caddy (if needed)
ssh root@187.124.217.8 "cd /opt/tuckinn/platform/infra/docker && docker compose restart caddy"

# Check CSP headers
ssh root@187.124.217.8 "curl -I https://187.124.217.8.sslip.io/"
```
