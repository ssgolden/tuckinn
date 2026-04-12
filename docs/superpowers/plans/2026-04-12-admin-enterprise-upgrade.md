# Admin Backend Enterprise Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Tuckinn Proper admin backend from a single 1,134-line monolith page into a high-end enterprise admin with sidebar navigation, proper routes, data tables, and new features.

**Architecture:** Next.js App Router with sidebar-based navigation. Each section gets its own route and page. Shared layout provides nav, auth guard, and session management. All existing API endpoints are preserved and re-wired into dedicated page components. shadcn/ui component library for professional enterprise UI.

**Tech Stack:** Next.js 15 App Router, TypeScript, shadcn/ui, Tailwind CSS, Lucide React icons, Recharts for analytics

**Local dev URL:** http://localhost:3101 (admin app) → API at https://api.187.124.217.8.sslip.io/api

---

## Current State Assessment

### What exists (MUST preserve):
- **Login/auth** — email + password → JWT session (localStorage)
- **Categories** — CRUD: create, list, edit (slug, name, description, sort, visible)
- **Products** — CRUD: create, list, edit, archive/restore, delete, image upload
- **Modifiers** — Groups CRUD, Options CRUD, attach/detach groups to products
- **Media upload** — file upload → API → return URL

### What's broken/bad:
- 1,134 lines in a single `page.tsx` — everything in one file
- Inline styles via `styles` object — no component library, no design system
- No navigation — just scroll through panels
- No sidebar, no menus, no sub-menus
- Edit forms inline inside list cards — terrible UX
- No search, no filtering, no sorting on lists
- No order management visible from admin
- No analytics dashboard
- No table/QR management
- No content/CMS management
- No notifications view

### API endpoints available but NOT wired into admin:
| Module | Endpoints | Currently in Admin? |
|--------|-----------|---------------------|
| Orders | GET /, GET /:id, GET /public/:orderNumber | ❌ No |
| Fulfillment | GET /board, PATCH /orders/:id/status | ❌ No |
| Analytics | GET /overview, /revenue, /popular-products, /peak-hours, /order-statuses | ❌ No |
| Tables | GET /, GET /public/:slug, POST /, PATCH /:id, DELETE /:id | ❌ No |
| Content | GET /, GET /:id, POST /, PATCH /:id, DELETE /:id | ❌ No |
| Notifications | GET /, GET /:id | ❌ No |

---

## Proposed Admin Structure

```
/admin
├── /                     → Dashboard (analytics overview)
├── /catalog
│   ├── /categories       → Categories list + CRUD
│   ├── /products         → Products list + CRUD + archive/delete/image
│   └── /modifiers        → Modifier groups + options + attach
├── /orders
│   ├── /                 → Orders list with filters
│   └── /[id]             → Order detail + status transitions
├── /tables               → Dining tables + QR code management
├── /content              → CMS blocks (announcement-bar, hero-highlight)
├── /notifications        → Notification log
├── /settings
│   ├── /profile          → User profile
│   ├── /team             → Team management (future)
│   └── /webhooks         → Webhook status
└── /login                → Auth page (if not authenticated)
```

### Sidebar Navigation

```
🏪 Tuckinn Proper
─────────────────
📊 Dashboard
📦 Catalog ▸
   ├ Categories
   ├ Products
   └ Modifiers
📋 Orders ▸
   ├ All Orders
   └ [Order Detail]
🪑 Tables
📝 Content
🔔 Notifications
⚙️ Settings ▸
   ├ Profile
   ├ Team
   └ Webhooks
─────────────────
[Sign out]
```

---

## New Features

| Feature | Priority | Description |
|---------|----------|-------------|
| 📊 Dashboard | P1 | Analytics overview: revenue chart, order statuses, popular products, peak hours |
| 📋 Orders | P1 | Full order management: list with filters (status/date), detail view, status transitions |
| 🪑 Tables | P1 | Table CRUD, QR code preview/download, enable/disable tables |
| 🔍 Search | P1 | Global search + per-list search and filtering |
| 📝 Content | P2 | CMS block editor (announcement bar, hero highlights) |
| 🔔 Notifications | P2 | Notification log with filtered view |
| 📱 Responsive | P2 | Mobile-friendly sidebar (collapsible) |
| ⚙️ Settings | P3 | Profile, team invite, webhook status |
| 📤 Bulk Actions | P3 | Bulk archive/delete products, bulk status update orders |
| 🌙 Dark Mode | P3 | Toggle light/dark theme |

---

## Dependency Graph

```
T1 ──┬── T3 ──┐
     │        ├── T7 ── T8 ── T9 ── T10
T2 ──┤        │
     ├── T4 ──┤
     ├── T5 ──┤
     └── T6 ──┘
```

---

## Tasks

### T1: Set up shadcn/ui + Tailwind + project structure
- **depends_on**: []
- **location**: `apps/admin/`
- **description**:
  1. Install shadcn/ui, tailwindcss, @tailwindcss/postcss, lucide-react, recharts
  2. Initialize shadcn with `npx shadcn@latest init` — choose "new-york" style, zinc palette
  3. Install components: button, card, input, label, select, textarea, checkbox, table, badge, dialog, dropdown-menu, sheet, tabs, separator, avatar, skeleton, toast, switch
  4. Create `app/layout.tsx` with `<html>` + `<body>` + global Tailwind classes
  5. Delete old `globals.css` inline styles, replace with Tailwind directives
  6. Delete old `_admin/primitives.tsx`, `_admin/auth-shell.tsx`, `_admin/types.ts`
  7. Update `next.config.ts` if needed for shadcn image domains
  8. Verify `pnpm dev` starts clean at localhost:3101
- **validation**: App starts with empty Tailwind page, no console errors
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T2: Create auth + layout infrastructure
- **depends_on**: []
- **location**: `apps/admin/app/layout.tsx`, `apps/admin/app/login/page.tsx`, `apps/admin/lib/auth-context.tsx`, `apps/admin/lib/api.ts`
- **description**:
  1. Create `lib/auth-context.tsx` — React context providing `session`, `login()`, `logout()`, `isLoading`
  2. Create `app/(auth)/login/page.tsx` — clean login card with email/password, error display
  3. Create `app/(admin)/layout.tsx` — sidebar + main content area, auth guard (redirect to /login if no session)
  4. Create `app/(admin)/dashboard/page.tsx` — placeholder dashboard
  5. Update `lib/api.ts` — keep existing API functions, add `AdminContext` re-export
  6. Verify login flow works: type credentials → get session → redirect to /dashboard
- **validation**: Login page appears, successful login redirects to dashboard placeholder
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T3: Build sidebar navigation component
- **depends_on**: [T1]
- **location**: `apps/admin/components/sidebar.tsx`, `apps/admin/components/nav-item.tsx`, `apps/admin/components/nav-group.tsx`
- **description**:
  1. Create `components/sidebar.tsx` — collapsible sidebar with:
     - Logo + brand name at top
     - Nav groups with expandable sub-items
     - Active route highlighting (use `usePathname()`)
     - "Sign out" button at bottom
     - Mobile: Sheet (slide-out drawer) triggered by hamburger
  2. Create `components/nav-item.tsx` — single nav link with icon + label + active state
  3. Create `components/nav-group.tsx` — expandable group with chevron indicator
  4. Wire sidebar into `app/(admin)/layout.tsx`
  5. Navigation structure:
     ```
     Dashboard (LayoutDashboard icon)
     Catalog (Package icon) → Categories, Products, Modifiers
     Orders (ClipboardList icon) → All Orders
     Tables (Armchair icon)
     Content (FileText icon)
     Notifications (Bell icon)
     Settings (Settings icon) → Profile, Webhooks
     ```
- **validation**: Sidebar renders with all nav items, clicking navigates, active states highlight correctly, mobile collapse works
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T4: Migrate Categories management to new route
- **depends_on**: [T1]
- **location**: `apps/admin/app/(admin)/catalog/categories/page.tsx`, `apps/admin/components/data-table.tsx`, `apps/admin/components/category-form.tsx`
- **description**:
  1. Create `components/data-table.tsx` — reusable table component with:
     - Column definitions (header, accessor, sortable)
     - Search/filter bar
     - Pagination
     - Row actions (edit/delete)
  2. Create `components/category-form.tsx` — dialog/sheet-based form for create + edit:
     - Slug (auto-generate from name), Name, Description, Sort Order, Visible toggle
     - Pre-populate when editing
     - Cancel + Save buttons
  3. Create `app/(admin)/catalog/categories/page.tsx`:
     - Data table with columns: Name, Slug, Sort, Visible, Actions
     - "New Category" button opens dialog
     - Click row or Edit → opens edit dialog
     - Delete with confirmation
     - Loads from `/catalog/categories?locationCode=main`
     - All CRUD uses `withAdminSession` for token refresh
- **validation**: Categories list loads from API, create/edit dialog works, delete confirms, table is searchable
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T5: Migrate Products management to new route
- **depends_on**: [T1]
- **location**: `apps/admin/app/(admin)/catalog/products/page.tsx`, `apps/admin/components/product-form.tsx`
- **description**:
  1. Create `components/product-form.tsx` — dialog/sheet form:
     - Category select, Slug, Name, Short/Long description
     - Image URL + file upload (reuse existing uploadAdminMedia)
     - Image preview + clear button
     - SKU, Variant Name, Price Amount, Sort Order
     - Featured checkbox, Status select (draft/active/archived)
  2. Create `app/(admin)/catalog/products/page.tsx`:
     - Data table: Name, Category, Price, Status, Featured, Actions
     - Row click → view detail (future), Edit → dialog, Archive/Restore toggle, Delete
     - Filter by category, search by name
     - Product image thumbnail in table row
     - Modifier chips showing attached modifier groups with X to detach
  3. Preserve ALL existing product CRUD functionality
- **validation**: Products list loads, create/edit via dialog, archive/restore/delete work, image upload works, modifier chip detach works
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T6: Migrate Modifiers management to new route
- **depends_on**: [T1]
- **location**: `apps/admin/app/(admin)/catalog/modifiers/page.tsx`, `apps/admin/components/modifier-group-card.tsx`, `apps/admin/components/modifier-option-form.tsx`, `apps/admin/components/attach-group-dialog.tsx`
- **description**:
  1. Create `components/modifier-group-card.tsx` — expandable card showing:
     - Group header: Name, Min/Max, Required badge, Edit button
     - Expandable options list with inline edit
     - "Add option" button at bottom
     - "Attach to product" button
  2. Create `components/modifier-option-form.tsx` — mini form for option create/edit
  3. Create `components/attach-group-dialog.tsx` — dialog to select product + attach
  4. Create `app/(admin)/catalog/modifiers/page.tsx`:
     - List of modifier groups as expandable cards
     - "New Group" button → dialog form
     - Options managed inline within each group card
     - Attach/detach products from each group
  5. Preserve ALL existing modifier CRUD + attach/detach functionality
- **validation**: Groups list, create/edit groups, create/edit options, attach to products, detach from products
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T7: Build Orders management page
- **depends_on**: [T3, T4]
- **location**: `apps/admin/app/(admin)/orders/page.tsx`, `apps/admin/app/(admin)/orders/[id]/page.tsx`, `apps/admin/components/order-status-badge.tsx`, `apps/admin/components/status-transition-buttons.tsx`
- **description**:
  1. Create `components/order-status-badge.tsx` — color-coded badge per status:
     - pending_payment=yellow, paid=blue, accepted=cyan, preparing=orange, ready=green, completed=emerald, cancelled=red, refunded=gray
  2. Create `components/status-transition-buttons.tsx` — buttons for valid transitions per current status
  3. Create `app/(admin)/orders/page.tsx`:
     - Data table: Order #, Customer, Type, Status, Total, Date, Actions
     - Filter by status (tabs: All, Active, Completed, Cancelled)
     - Search by order number or customer name
     - Click row → navigate to detail
  4. Create `app/(admin)/orders/[id]/page.tsx`:
     - Order header: number, status badge, customer info, timestamps
     - Line items table with modifiers
     - Status transition buttons (uses PATCH /fulfillment/orders/:id/status)
     - Payment info section (provider, status, amounts)
     - Back to orders link
- **validation**: Orders list loads with filters, order detail shows items + status transitions work
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T8: Build Dashboard analytics page
- **depends_on**: [T3, T4]
- **location**: `apps/admin/app/(admin)/dashboard/page.tsx`, `apps/admin/components/stats-card.tsx`, `apps/admin/components/revenue-chart.tsx`, `apps/admin/components/order-status-pie.tsx`, `apps/admin/components/popular-products-list.tsx`, `apps/admin/components/peak-hours-chart.tsx`
- **description**:
  1. Create `components/stats-card.tsx` — metric card with icon, value, label, optional trend
  2. Create `components/revenue-chart.tsx` — line/bar chart using Recharts (GET /analytics/revenue)
  3. Create `components/order-status-pie.tsx` — pie chart of order statuses (GET /analytics/order-statuses)
  4. Create `components/popular-products-list.tsx` — ranked list (GET /analytics/popular-products)
  5. Create `components/peak-hours-chart.tsx` — bar chart by hour (GET /analytics/peak-hours)
  6. Create `app/(admin)/dashboard/page.tsx`:
     - Top row: 4 stat cards (total orders, revenue, avg order value, active orders)
     - Row 2: Revenue chart (left 2/3) + Order status pie (right 1/3)
     - Row 3: Popular products (left 1/2) + Peak hours (right 1/2)
     - Time range selector (7d / 30d / all)
- **validation**: Dashboard loads with live data, charts render, time range switches
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T9: Build Tables + QR management page
- **depends_on**: [T3, T4]
- **location**: `apps/admin/app/(admin)/tables/page.tsx`, `apps/admin/components/table-form.tsx`, `apps/admin/components/qr-code-card.tsx`
- **description**:
  1. Create `components/qr-code-card.tsx` — card showing table name, number, QR image, download button
  2. Create `components/table-form.tsx` — form: table number, name, seats, active toggle
  3. Create `app/(admin)/tables/page.tsx`:
     - Grid of table cards with QR codes
     - "New Table" button → dialog
     - Edit/delete per table
     - Toggle active/inactive
     - Download QR code button per table
- **validation**: Tables list loads, CRUD works, QR codes display, download works
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T10: Build Content + Notifications + Settings pages
- **depends_on**: [T3, T7]
- **location**: `apps/admin/app/(admin)/content/page.tsx`, `apps/admin/app/(admin)/notifications/page.tsx`, `apps/admin/app/(admin)/settings/profile/page.tsx`, `apps/admin/app/(admin)/settings/webhooks/page.tsx`
- **description**:
  1. Create `app/(admin)/content/page.tsx`:
     - List of CMS content blocks (GET /content)
     - Edit dialog for each block (key, title, status, payload editor)
     - Create/delete blocks
  2. Create `app/(admin)/notifications/page.tsx`:
     - Log table: date, channel, recipient, template, status (sent/failed)
     - Filter by channel (email/sms/push/webhook)
  3. Create `app/(admin)/settings/profile/page.tsx`:
     - Display: email, name, roles, session info
     - Logout button
  4. Create `app/(admin)/settings/webhooks/page.tsx`:
     - Webhook event log from /webhooks endpoint (future: when admin-authed GET exists)
     - Placeholder until API endpoint is ready
- **validation**: Content blocks CRUD, notification log loads, profile displays user info
- **status**: Not Completed
- **log**:
- **files edited/created**:

---

## Parallel Execution Groups

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T1, T2 | Immediately |
| 2 | T3, T4, T5, T6 | Wave 1 complete |
| 3 | T7, T8, T9 | T3 + T4 complete |
| 4 | T10 | T3 + T7 complete |

**Total estimated effort:** 3-4 days with single agent, 1.5-2 days with parallel agents

---

## Testing Strategy

1. **Local dev only** — `cd apps/admin && pnpm dev --port 3101`, API proxied to VPS
2. Each task verified independently before moving to next wave
3. After T10: full smoke test of all routes, all CRUD, all navigation
4. Final: build Docker image, verify no build errors

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| shadcn/ui + Next.js 15 compat | Use latest shadcn, test immediately after T1 |
| localStorage auth not working with routing | Auth context wraps all routes, tested in T2 |
| Missing API endpoints for new pages | Orders/tables/analytics/content APIs already exist on VPS |
| Data loss during migration | We're REBUILDING the UI, not touching the API. All data is safe. |
| Breaking existing admin while building new | Keep old page.tsx as `page.legacy.tsx` until new is complete, then delete |
| Image upload in new product form | Reuse existing `uploadAdminMedia` from `lib/api.ts` |

## Preserved Functionality Checklist

- [ ] Category CRUD (create, read, edit slug/name/description/sort/visible)
- [ ] Product CRUD (create, read, edit all fields, image upload, archive/restore, delete)
- [ ] Modifier group CRUD (create, read, edit name/description/min/max/sort/required)
- [ ] Modifier option CRUD (create, read, edit name/description/price/sort/default/active)
- [ ] Attach/detach modifier groups to/from products
- [ ] Session auth (login, logout, restore, refresh)
- [ ] Image upload to media endpoint