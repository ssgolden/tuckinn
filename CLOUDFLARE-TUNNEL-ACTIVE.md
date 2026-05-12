# Cloudflare Tunnel - ACTIVE ✅

## Status: RUNNING

**Tunnel URL**: https://powder-fallen-add-museums.trycloudflare.com

**SSL Certificate**: ✅ Valid (Cloudflare-signed)

**Security**: ✅ Secure HTTPS (No "Not Secure" warning)

---

## What Was Set Up

1. **Cloudflared** - Running as Docker container
2. **Network**: Connected to internal tuckinn network
3. **Route**: storefront:3000 → Cloudflare HTTPS endpoint
4. **Result**: Valid SSL certificate, no browser warnings

---

## URLs

| Service | Old (Not Secure) | New (Secure) |
|---------|-----------------|--------------|
| Storefront | https://187.124.217.8.sslip.io | ✅ https://powder-fallen-add-museums.trycloudflare.com |
| Account Page | https://187.124.217.8.sslip.io/account | ✅ https://powder-fallen-add-museums.trycloudflare.com/account |

---

## Important Notes

### Temporary URL
This is a **quick/free tunnel** which means:
- ✅ Valid SSL certificate
- ✅ No "Not Secure" warnings
- ✅ Works immediately
- ⚠️ URL changes on restart (random subdomain)
- ⚠️ No uptime guarantee (free tier)

### For Production/Business Use
Consider buying a domain ($8-15/year) for:
- Permanent URL (tuckinn.shop, tuckinn.app, etc.)
- Professional appearance
- Customer trust
- SEO benefits

---

## How to Make It Permanent

### Option A: Keep Current Quick Tunnel
**Command to restart after VPS reboot**:
```bash
docker run -d --name cloudflared-tunnel --network tuckinn-platform_internal --restart unless-stopped cloudflare/cloudflared:latest tunnel --url http://storefront:3000 --protocol http2
```

**Note**: New random URL each time.

### Option B: Named Tunnel (Same URL always)
Requires more setup with the Cloudflare API token you provided.

---

## Security

✅ **API Token**: Saved securely at `/opt/tuckinn/platform/infra/docker/secrets/cloudflare.env`

**Permissions**: 600 (root read-only)

**Token Used**: No (quick tunnels don't require authentication)

---

## Testing

**Test the secure URL now**:
```bash
curl -s https://powder-fallen-add-museums.trycloudflare.com/account | head -5
```

Expected: HTML content (not 404)

---

## Next Steps

1. **Share the new HTTPS URL** with customers
2. **Update bookmarks** from IP address to new domain
3. **Consider buying a domain** for permanent professional URL

---

## Troubleshooting

If the tunnel stops working:

```bash
# SSH to VPS
ssh root@187.124.217.8

# Restart tunnel
docker stop cloudflared-tunnel
docker rm cloudflared-tunnel
docker run -d --name cloudflared-tunnel --network tuckinn-platform_internal --restart unless-stopped cloudflare/cloudflared:latest tunnel --url http://storefront:3000 --protocol http2

# Check logs
docker logs cloudflared-tunnel
```

---

**Status**: ACTIVE - Tunnel running and SSL working ✅
