# TuckInn Domain Migration Plan
**From**: Cloudflare Quick Tunnel → **To**: tuckinnproper.com
**VPS IP**: 187.124.217.8
**Date**: 2026-04-17

---

## Phase 1: DNS Configuration

### Required DNS Records

| Type | Host | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| A | @ | 187.124.217.8 | 300 | Main domain → VPS |
| A | www | 187.124.217.8 | 300 | www redirect |
| A | api | 187.124.217.8 | 300 | API subdomain |
| A | admin | 187.124.217.8 | 300 | Admin panel |
| A | staff | 187.124.217.8 | 300 | Staff app |

### DNS Verification
```bash
# Check propagation
nslookup tuckinnproper.com
nslookup api.tuckinnproper.com
nslookup admin.tuckinnproper.com
nslookup staff.tuckinnproper.com
```

---

## Phase 2: VPS Configuration Updates

### 2.1 Update Caddyfile (Remove tls internal, use Let's Encrypt)

```caddyfile
# New Caddyfile for tuckinnproper.com

tuckinnproper.com {
    encode gzip zstd
    
    handle /api/* {
        reverse_proxy api:3200
    }
    
    handle /uploads/* {
        reverse_proxy api:3200
    }
    
    reverse_proxy storefront:3000
    
    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
    # Note: tls internal removed - Let's Encrypt will be used automatically
}

api.tuckinnproper.com {
    encode gzip zstd
    reverse_proxy api:3200
    header {
        X-Content-Type-Options nosniff
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
}

admin.tuckinnproper.com {
    encode gzip zstd
    
    handle /api/* {
        reverse_proxy api:3200
    }
    
    reverse_proxy admin:3000
    
    header {
        X-Content-Type-Options nosniff
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
}

staff.tuckinnproper.com {
    encode gzip zstd
    
    handle /api/* {
        reverse_proxy api:3200
    }
    
    reverse_proxy staff:3000
    
    header {
        X-Content-Type-Options nosniff
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    }
}

# Redirect www to non-www
www.tuckinnproper.com {
    redir https://tuckinnproper.com{uri}
}
```

### 2.2 Update Environment Variables

Edit `/opt/tuckinn/platform/.env.production`:

```bash
# Domain Configuration
STORE_DOMAIN=tuckinnproper.com
ADMIN_DOMAIN=admin.tuckinnproper.com
STAFF_DOMAIN=staff.tuckinnproper.com
API_DOMAIN=api.tuckinnproper.com

# Public URLs
NEXT_PUBLIC_API_BASE_URL=https://api.tuckinnproper.com/api
NEXT_PUBLIC_ADMIN_APP_URL=https://admin.tuckinnproper.com
NEXT_PUBLIC_STAFF_APP_URL=https://staff.tuckinnproper.com

# Allowed Origins (CORS)
ALLOWED_ORIGINS=https://tuckinnproper.com,https://admin.tuckinnproper.com,https://staff.tuckinnproper.com,https://api.tuckinnproper.com
```

### 2.3 Update Docker Compose Build Args

```yaml
storefront:
  build:
    args:
      NEXT_PUBLIC_API_BASE_URL: https://api.tuckinnproper.com/api
      NEXT_PUBLIC_ADMIN_APP_URL: https://admin.tuckinnproper.com
      NEXT_PUBLIC_STAFF_APP_URL: https://staff.tuckinnproper.com
      # ...

admin:
  build:
    args:
      NEXT_PUBLIC_API_BASE_URL: https://api.tuckinnproper.com/api
      # ...

staff:
  build:
    args:
      NEXT_PUBLIC_API_BASE_URL: https://api.tuckinnproper.com/api
      # ...
```

---

## Phase 3: Application Code Updates

### 3.1 Frontend Apps Environment Setup

Each Next.js app needs environment variables updated. Docker build args will handle this during build.

### 3.2 API CORS Configuration

The CORS settings in `main.ts` should already handle this via `ALLOWED_ORIGINS` env var.

---

## Phase 4: Execution Steps

### Step 1: Configure DNS (Manual - User Action)
Log in to your domain registrar and add the A records listed in Phase 1.

### Step 2: Update VPS Configuration
```bash
# SSH to VPS
ssh root@187.124.217.8

# Backup current config
cd /opt/tuckinn/platform/infra/docker
cp Caddyfile Caddyfile.backup
cp ../../.env.production ../../.env.production.backup

# Update configs (use automated script)
```

### Step 3: Rebuild and Restart
```bash
# Down the stack
docker compose -f docker-compose.prod.yml down

# Rebuild frontends with new build args
docker compose -f docker-compose.prod.yml build --no-cache storefront admin staff

# Start everything
docker compose -f docker-compose.prod.yml up -d

# Verify
docker compose -f docker-compose.prod.yml ps
```

### Step 4: SSL Certificate Verification
Caddy will automatically request SSL certificates from Let's Encrypt. This may take 1-2 minutes on first startup.

```bash
# Watch Caddy logs
docker compose -f docker-compose.prod.yml logs -f caddy

# Look for certificate installation messages
```

---

## Phase 5: Post-Migration Verification

### 5.1 Test All Endpoints

| URL | Expected Result |
|-----|-----------------|
| https://tuckinnproper.com | Storefront loads |
| https://tuckinnproper.com/api/health | `{"status":"ok"}` |
| https://api.tuckinnproper.com/api/health | `{"status":"ok"}` |
| https://admin.tuckinnproper.com | Admin login page |
| https://staff.tuckinnproper.com | Staff login page |

### 5.2 SSL Certificate Check
```bash
# Verify SSL
curl -v https://tuckinnproper.com 2>&1 | grep -E "(subject|issuer|SSL)"
```

---

## Phase 6: Cleanup

1. Remove Cloudflare tunnel (if no longer needed)
2. Update any bookmarks/documentation
3. Monitor for 24 hours

---

## Rollback Plan

If issues occur:
```bash
# Restore backups
cd /opt/tuckinn/platform/infra/docker
cp Caddyfile.backup Caddyfile
cp ../../.env.production.backup ../../.env.production
docker compose -f docker-compose.prod.yml restart
```

---

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| DNS Propagation | 5-30 minutes |
| Config Updates | 5 minutes |
| Rebuild & Restart | 3-5 minutes |
| SSL Certificate | 1-2 minutes |
| **Total** | **15-45 minutes** |

---

## DNS Provider Instructions

### If using Cloudflare (Recommended)
1. Log into Cloudflare dashboard
2. Select your domain
3. Go to DNS > Records
4. Add A records:
   - `@` pointing to `187.124.217.8`
   - `api` pointing to `187.124.217.8`
   - `admin` pointing to `187.124.217.8`
   - `staff` pointing to `187.124.217.8`
5. Set TTL to Auto or 300 seconds
6. Turn OFF the orange cloud (Proxy) temporarily for initial setup

### If using GoDaddy
1. Log into GoDaddy DNS Management
2. Add A records for @, api, admin, staff
3. Point all to 187.124.217.8
4. Save changes

### If using Namecheap
1. Go to Domain List → Manage → Advanced DNS
2. Add A records
3. Use @ for root, and subdomains for api/admin/staff
4. Save changes
