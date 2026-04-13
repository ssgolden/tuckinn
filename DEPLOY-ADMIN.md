# Tuckinn Admin — Deployment Guide

**Generated:** 2026-04-13
**Status:** Ready for review → deploy to VPS after local approval

---

## What Was Built

| Feature | Before | After |
|---------|--------|-------|
| **Login** | 404 on VPS (route conflict) | ✅ Working auth with real JWT tokens |
| **Auth** | Mock dev bypass that returned 401s | ✅ Auto-login with real credentials via proxy |
| **CORS** | Blocked (localhost → VPS API) | ✅ Next.js API proxy at `/api/proxy/[...path]` |
| **Categories** | Simple list + tiny dialog | ✅ Expanded view with products nested inside, inline visibility toggle, drag reorder (up/down), edit dialog, product counts |
| **Products** | Simple table with sample data | ✅ Shopify-level list with search, category filter, status tabs, image thumbnails, click-to-detail |
| **Product Detail** | Didn't exist | ✅ Full editor at `/catalog/products/[id]` with 3 tabs: Details, Variants & Pricing, Modifier Groups |
| **Product Images** | None | ✅ Upload via `/media/upload`, preview, remove, replace |
| **Modifier Groups** | Read-only list | ✅ Full CRUD create/edit with all options, price deltas in EUR |
| **Orders** | Sample data, wrong prices | ✅ Real Tuckinn data, EUR pricing, status advance buttons |
| **Tables** | Generic 10-table sample | ✅ 15 real tables with names from database |
| **Prices** | Cents (950 = €9.50) | ✅ Euros (9.95 = €9.95) — matches live API |
| **Sidebar** | `asChild` crash on base-ui | ✅ Fixed with `render` prop pattern |

---

## Files Changed/Created

### New Files
```
apps/admin/src/app/api/proxy/[...path]/route.ts     — API proxy (avoids CORS)
apps/admin/src/app/(admin)/catalog/products/[id]/page.tsx  — Shopify-style product editor
apps/admin/src/app/(admin)/catalog/categories/page.tsx     — Rebuilt with expand+products
apps/admin/src/app/(admin)/catalog/products/page.tsx        — Rebuilt with search/filter
apps/admin/src/app/(admin)/catalog/modifiers/page.tsx      — Real modifier data
apps/admin/src/app/(admin)/orders/page.tsx                   — Real order data, EUR prices
apps/admin/src/app/(admin)/tables/page.tsx                  — 15 real tables
apps/admin/src/app/(admin)/content/page.tsx                 — CMS blocks
apps/admin/src/app/(admin)/notifications/page.tsx            — Notification channels
apps/admin/src/app/(admin)/settings/profile/page.tsx        — User profile
apps/admin/src/app/(admin)/settings/webhooks/page.tsx       — Webhook events
apps/admin/src/app/(admin)/page.tsx                          — Dashboard with real counts
apps/admin/src/app/login/page.tsx                            — Login page
apps/admin/src/app/(admin)/layout.tsx                        — Auth guard + sidebar
apps/admin/src/components/image-upload.tsx                   — Reusable image upload
apps/admin/src/components/sidebar.tsx                        — Fixed asChild→render
```

### Modified Files
```
apps/admin/src/lib/auth-context.tsx      — Auto-login via proxy
apps/admin/src/lib/api.ts                — Dev proxy base URL
apps/admin/src/app/globals.css           — (existing)
```

### Deleted Files
```
apps/admin/src/app/page.tsx               — Root redirect (was shadowing admin routes)
```

---

## Deployment Steps

### 1. Build Locally (Verify)
```bash
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\admin"
npx next build
# Should show all routes ✅
```

### 2. Push Code to VPS
```bash
# From project root
cd "C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform"
# Option A: Git push + pull on VPS
git add -A && git commit -m "feat: Shopify-level admin panel with product editor, image upload, categories with products, search/filter"
git push origin main

# Then on VPS:
ssh root@187.124.217.8 "cd /opt/tuckinn/platform && git pull"
```

### 3. Rebuild Docker on VPS
```bash
ssh root@187.124.217.8 << 'EOF'
cd /opt/tuckinn/platform/infra/docker
docker compose -f docker-compose.prod.yml build admin
docker compose -f docker-compose.prod.yml up -d admin
EOF
```

### 4. Verify on VPS
```bash
# Check admin is healthy
ssh root@187.124.217.8 "docker compose -f /opt/tuckinn/platform/infra/docker/docker-compose.prod.yml ps admin"

# Test all routes
curl -sk https://admin.187.124.217.8.sslip.io/login      # Should return 200 (not 404)
curl -sk https://admin.187.124.217.8.sslip.io/            # Should show dashboard
curl -sk https://admin.187.124.217.8.sslip.io/catalog/categories  # Should show categories
curl -sk https://admin.187.124.217.8.sslip.io/catalog/products     # Should show products
```

### 5. Test Login on VPS
- Navigate to `https://admin.187.124.217.8.sslip.io/login`
- Login with: `RichRonHoll@tuckinn.local` / `Tuckinn2026!`
- Dashboard should show real category/product counts

---

## Environment Variables (Required on VPS)

The VPS `.env.production` already has:
- `NEXT_PUBLIC_API_BASE_URL=https://api.187.124.217.8.sslip.io/api` ✅
- `NEXT_PUBLIC_ADMIN_APP_URL=https://admin.187.124.217.8.sslip.io` ✅
- `ALLOWED_ORIGINS` includes admin domain ✅

No new environment variables needed for this deployment.

---

## Rolled-Back Steps (If Needed)

```bash
# Roll back admin container to previous image
ssh root@187.124.217.8
cd /opt/tuckinn/platform/infra/docker
docker compose -f docker-compose.prod.yml down admin
# Restore previous image/tag if needed
docker compose -f docker-compose.prod.yml up -d admin
```

---

## Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `RichRonHoll@tuckinn.local` |
| **Password** | `Tuckinn2026!` |
| **Role** | `admin` |

---

## Known Limitations (Post-Launch)

1. **Tables page** — Shows 15 real table names from database but API CRUD not yet built (read-only with "coming soon" banner)
2. **Content/Notifications/Webhooks** — Show current data structure but API endpoints not yet built for CRUD
3. **Drag-and-drop reorder** — Uses up/down buttons; full drag-and-drop can be added later with `@dnd-kit`
4. **Product detail page** — Save currently updates flat fields; variant CRUD via PATCH endpoint is functional but modifier group attach/detach uses slug-based search which may need product reload to reflect changes
5. **Image upload** — Works but doesn't show upload progress bar (adds instantly after upload completes)

---

## Architecture Notes

- **Proxy Pattern**: All API calls from the browser go through `/api/proxy/[...path]` in dev mode to avoid CORS. In production, the admin app deployed on the same domain uses direct API calls (the proxy is only active when `NODE_ENV === 'development'`).
- **Auth Flow**: On mount → try stored refresh token → if fails → try dev auto-login → if fails → show login page. This means:
  - **Dev** (`localhost:3101`): Auto-logs in as Platform Admin
  - **Production**: Normal login flow with real credentials
- **`@base-ui/react` Pattern**: All base-ui components use `render` prop (NOT Radix's `asChild`). This was the root cause of the original VPS 404 bug.