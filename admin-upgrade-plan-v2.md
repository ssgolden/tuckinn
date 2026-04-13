# Admin Panel Upgrade Plan v2

**Generated:** 2026-04-13
**Status:** Ready for review

---

## Current State Summary

### Fully Working (Real API)
- Dashboard — live stats, order breakdown, top products
- Categories — full CRUD
- Products — listing + detail editor (variants, modifiers, image upload, archive/restore/delete)
- Modifiers — group CRUD + inline option CRUD
- Orders — list with status advancement
- Tables — full CRUD
- Content Blocks — full CRUD
- Login/Auth — real credentials, token refresh

### Partially Working
- Notifications — localStorage only, no backend persistence
- Settings > Profile — password change not implemented (toast: "coming soon")
- Settings > Webhooks — completely hardcoded, no real data

### Not Yet in Admin (Backend models exist or referenced in storefront)
- Promotions/Discounts — Prisma `Promotion` model exists, no admin UI
- Staff/User management — `User` + roles in backend, no admin UI
- Audit Log — Prisma `AuditLog` model exists, no admin UI
- Delivery zones/fees — no backend model or admin UI
- Opening hours — no backend model or admin UI
- Business settings — no backend model or admin UI

---

## Upgrade Phases

### Phase 1: Polish & Fix Existing Pages (1-2 days)

Priority: Fix broken/incomplete features before adding new ones.

#### 1A. Settings > Profile — Password Change
**File:** `apps/admin/src/app/(admin)/settings/profile/page.tsx`
**Backend:** Add `PATCH /auth/password` endpoint (requires current password + new password)
**Admin:** Wire "Update Password" button to new endpoint
**Why:** Currently shows "coming soon" toast. Critical for production security.

#### 1B. Settings > Webhooks — Real Data
**File:** `apps/admin/src/app/(admin)/settings/webhooks/page.tsx`
**Backend:** Add admin endpoints:
- `GET /webhooks/events` — list recent webhook events from `WebhookEvent` table
- `GET /webhooks/config` — get current webhook config (endpoint URLs, enabled events)
- `PATCH /webhooks/config` — update webhook endpoint URLs and event subscriptions
**Admin:** Replace hardcoded `sampleEvents` with real API data. Add endpoint URL editing.
**Why:** Currently 100% fake data. Useless for operators.

#### 1C. Notifications — Backend Persistence
**File:** `apps/admin/src/app/(admin)/notifications/page.tsx`
**Backend:** Add endpoints:
- `GET /notifications/config` — get channel configs (email provider, from address, Twilio SID, etc.)
- `PATCH /notifications/config` — update channel configs
**Admin:** Replace localStorage with real API calls. Add test-send button per channel.
**Why:** localStorage settings don't survive browser clear or work across devices.

#### 1D. Remove Dev Bypass Hardcoding
**File:** `apps/admin/src/lib/auth-context.tsx`
**Change:** Remove `DEV_EMAIL`/`DEV_PASSWORD` hardcoded credentials. Use env var `NEXT_PUBLIC_DEV_MODE=true` to enable auto-login with a stored session instead.
**Why:** Hardcoded production credentials in client code is a security risk.

---

### Phase 2: New Admin Pages (3-5 days)

Priority: Add the features the storefront already references but admin can't manage.

#### 2A. Promotions & Discounts Page
**Route:** `/promotions`
**Backend:** Prisma `Promotion` model already exists. Add:
- `GET /promotions` — list promotions
- `POST /promotions` — create promotion
- `PATCH /promotions/:id` — update promotion
- `DELETE /promotions/:id` — delete promotion
**Admin UI:** Shopify-style promo management:
- List: code, type (% off, flat off, free delivery), status (active/expired/scheduled), usage count
- Create/Edit: promo code, discount type + amount, min order value, max uses, start/end dates
- Toggle active/inactive
- Duplicate promo code
**Storefront impact:** Add promo code input to checkout flow

#### 2B. Staff & User Management Page
**Route:** `/staff`
**Backend:** Add admin endpoints:
- `GET /users` — list staff/admin users
- `POST /users` — invite staff member
- `PATCH /users/:id` — update role, toggle active
- `DELETE /users/:id` — deactivate user
- `POST /auth/reset-password` — admin-initiated password reset
**Admin UI:**
- List: name, email, role, last login, active status
- Create: email + role (admin, manager, staff)
- Edit: change role, toggle active
- Resend invite / reset password

#### 2C. Audit Log Page
**Route:** `/audit-log`
**Backend:** `AuditLog` model exists. Add:
- `GET /audit-log` — list with filters (user, action, date range)
**Admin UI:**
- Table: timestamp, user, action, entity type, entity ID, details
- Filters: by user, by action type, by date range
- Read-only (no create/edit/delete)

---

### Phase 3: Operational Features (2-3 days)

Priority: Features operators need to run the business day-to-day.

#### 3A. Business Settings Page
**Route:** `/settings/business`
**New Backend Model:** `BusinessSettings`
- opening hours per day of week (open time, close time, closed flag)
- ordering cutoff time (minutes before close)
- delivery radius / zones
- minimum delivery order amount
- delivery fee
- tax rate (VAT %)
- currency code
- contact phone, email, address
**Admin UI:**
- Weekly schedule grid (7 days, open/close times, closed toggle)
- Delivery zone configuration
- Tax settings
- Contact information
**Why:** No opening hours enforcement in storefront. Operators can't close online ordering.

#### 3B. Order Detail Page
**Route:** `/orders/[id]`
**Currently:** Orders page shows a table. No way to see full order details.
**Add:**
- Click order row → navigate to `/orders/[id]`
- Full order detail: items, quantities, prices, modifiers, notes, customer info, delivery address, payment status, timeline of status changes
- Refund button (calls Stripe refund API)
- Cancel button with reason
- Print receipt button

#### 3C. Product Sort Order (Drag & Drop)
**Enhancement to:** `/catalog/categories` and `/catalog/products`
**Change:** Add drag-and-drop reordering using `sortOrder` field that already exists on products and categories.
**UI:** Use `@dnd-kit/core` for drag handle in category and product lists.
**Why:** Currently products sort alphabetically. Operators need to control display order.

---

### Phase 4: Advanced Features (2-3 days)

Priority: Nice-to-haves that make the platform competitive.

#### 4A. Dashboard Analytics Deep Dive
**Enhancement to:** `/` dashboard
**Add:**
- Revenue chart (last 7 days, last 30 days)
- Orders chart (by hour, by day of week)
- Top selling products table (by revenue, by quantity)
- Average order value
- Peak hours heatmap
**Backend:** Add `GET /analytics/dashboard` endpoint that aggregates order data

#### 4B. Product Bulk Actions
**Enhancement to:** `/catalog/products`
**Add:**
- Multi-select checkboxes on product list
- Bulk actions: archive, restore, change category, export CSV
- CSV import for products (upload file with name, price, category, variants)

#### 4C. Storefront Theme/CMS Controls
**Route:** `/settings/theme` or expand `/content`
**Add:**
- Hero section text/image editing
- Trust badge editing
- Featured products selector (which products appear in "Featured" grid)
- Social links
- Footer content
**Why:** All storefront content is hardcoded in `content.ts`. Operators should be able to change these without a developer.

---

## Execution Priority

| # | Task | Impact | Effort | Phase |
|---|------|--------|--------|-------|
| 1 | Password change (1A) | Security | 0.5 day | 1 |
| 2 | Webhooks real data (1B) | Ops visibility | 1 day | 1 |
| 3 | Notifications backend (1C) | Ops config | 1 day | 1 |
| 4 | Remove dev hardcoding (1D) | Security | 0.5 day | 1 |
| 5 | Promotions page (2A) | Revenue | 2 days | 2 |
| 6 | Staff management (2B) | Ops | 1.5 days | 2 |
| 7 | Audit log (2C) | Security | 0.5 day | 2 |
| 8 | Business settings (3A) | Ops critical | 2 days | 3 |
| 9 | Order detail page (3B) | Ops | 1 day | 3 |
| 10 | Product sort order (3C) | UX | 0.5 day | 3 |
| 11 | Analytics deep dive (4A) | Revenue insight | 2 days | 4 |
| 12 | Bulk actions (4B) | Efficiency | 1 day | 4 |
| 13 | Storefront CMS (4C) | Ops autonomy | 1.5 days | 4 |

**Total estimate:** ~15 days across 4 phases

---

## @base-ui/react Reminder

All components use `render` prop, NOT `asChild`. This caused the original VPS 404 bug. Sidebar, Dialog, Sheet, Collapsible, DialogTrigger all use `render={<Component />}` pattern.

## Price Format Reminder

API returns prices in **EUR** (e.g., `9.95`, not `995`). All `formatPrice` functions must use `€${Number(amount).toFixed(2)}` without division.

## API Proxy Reminder

In dev, all API calls go through `/api/proxy/[...path]` to bypass CORS. Production uses `NEXT_PUBLIC_API_BASE_URL` directly.