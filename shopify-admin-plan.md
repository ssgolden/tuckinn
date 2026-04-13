# Plan: Shopify-Level Admin Panel for Tuckinn

**Generated**: 2026-04-13
**Status**: Awaiting approval

## Overview

Upgrade the Tuckinn admin from basic list+dialog pages to a Shopify-caliber product and catalog management system. This means: inline editing, image uploads, drag-to-reorder, full modifier management with nested options, product-category assignment, variant pricing, bulk status changes, and a rich product detail editor — all wired to the existing live NestJS API.

## Current State

| Feature | Currently Has | Shopify-Level Target |
|---------|---------------|---------------------|
| **Categories** | Simple table + create/edit dialog | Drag-reorder, visibility toggle, inline name edit, bulk actions |
| **Products** | Simple table + dialog | Full detail editor page: image upload, rich description, variant manager, modifier group assignment, status toggles, archive/restore |
| **Product Images** | None | Upload via `/media/upload` API, preview, remove, set primary |
| **Modifiers** | Group-level view only | Full CRUD for groups AND individual options, drag-reorder options, price delta editing, default/required toggles |
| **Product ↔ Modifiers** | Not connected | Assign/detach modifier groups to individual products |
| **Product ↔ Category** | Slug field in create form | Searchable category picker, multi-assign |
| **Pricing** | Single variant in create dialog | Multi-variant support (add/edit/delete variants), price formatted in EUR |
| **Bulk Actions** | None | Bulk archive/restore, bulk category reassignment |
| **Search/Filter** | None | Search products by name, filter by category/status |

## API Coverage (Already Exists)

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/catalog/categories` | GET, POST | Full CRUD |
| `/catalog/categories/:id` | PATCH | Update name/slug/visibility/order |
| `/catalog/products` | GET, POST | Full CRUD |
| `/catalog/products/:id` | PATCH, DELETE | Update any field, archive/restore, hard delete |
| `/modifiers/groups` | GET, POST | Full CRUD |
| `/modifiers/groups/:id` | PATCH | Update group settings |
| `/modifiers/options` | POST | Create option |
| `/modifiers/options/:id` | PATCH | Update option |
| `/modifiers/attach` | POST | Attach group to product |
| `/modifiers/products/:pid/groups/:gid` | DELETE | Detach group from product |
| `/media/upload` | POST | Image upload (FormData) |

## Dependency Graph

```
T1 ──┬── T3 ──┬── T5 ──┬── T7 ──┬── T9
     │        │        │        │
T2 ──┘        T4 ──────┘        T8
```

## Tasks

### T1: Product Detail Page (route + layout)
- **depends_on**: []
- **location**: `apps/admin/src/app/(admin)/catalog/products/[id]/page.tsx`
- **description**: Create a dedicated product detail/edit page at `/catalog/products/[id]`. This is the Shopify-style product editor. Clicking a product row in the products list navigates here. The page layout: left 60% for product info (name, slug, description, status, featured toggle), right 40% for image upload + preview. Tabs below for Variants, Modifiers, and Pricing.
- **validation**: Navigate to `/catalog/products/some-id`, page renders with product data or 404 skeleton.
- **agent**: coder
- **status**: Not Completed

### T2: Image Upload Component
- **depends_on**: []
- **location**: `apps/admin/src/components/image-upload.tsx`
- **description**: Build a reusable image upload component. Uses `POST /media/upload` with FormData (file + Authorization header). Shows drag-drop zone, thumbnail preview, progress indicator, and remove button. Supports the `UploadedMediaAsset` response type from the API (`{id, url, altText, mimeType, fileSizeBytes}`). This component will be used in T1 and T5.
- **validation**: Component renders, file selection triggers upload, response shows thumbnail.
- **agent**: coder
- **status**: Not Completed

### T3: Category Manager Upgrade (drag-reorder + inline edit)
- **depends_on**: [T1, T2]
- **location**: `apps/admin/src/app/(admin)/catalog/categories/page.tsx`
- **description**: Upgrade the categories page to Shopify-level:
  - **Drag-to-reorder**: Add up/down buttons on each row to change `sortOrder` via `PATCH /catalog/categories/:id`
  - **Inline editing**: Click category name to edit in-place
  - **Visibility toggle**: Switch component to toggle `isVisible` instantly
  - **Product count badge**: Show number of products per category
  - **Bulk actions**: Select multiple → bulk hide/show
  - **Search bar**: Filter categories by name
- **validation**: Reorder categories, toggle visibility, see product counts.
- **agent**: coder
- **status**: Not Completed

### T4: Variant & Pricing Editor
- **depends_on**: [T1, T2]
- **location**: `apps/admin/src/app/(admin)/catalog/products/[id]/variants-tab.tsx`
- **description**: Build the Variants tab inside the product detail page (T1). Each product has variants (name + price). Features:
  - List all variants with inline price editing (EUR format)
  - Add new variant row
  - Remove variant
  - Set default variant toggle
  - Price displayed and edited in euros (not cents — API already returns euros)
  - Save changes via `PATCH /catalog/products/:id`
- **validation**: Add a variant, change a price, set default, save, reload — values persist.
- **agent**: coder
- **status**: Not Completed

### T5: Modifier Groups Full CRUD (groups + options)
- **depends_on**: [T3]
- **location**: `apps/admin/src/app/(admin)/catalog/modifiers/page.tsx`
- **description**: Upgrade from read-only group view to full CRUD:
  - **Edit group**: Click group header to edit name, description, minSelect, maxSelect, isRequired
  - **Add option**: Button within each group to create new option (name, priceDeltaAmount, isDefault, isActive)
  - **Edit option**: Click option row to inline-edit price, name, toggle default/active
  - **Delete option**: Remove button with confirmation
  - **Drag-reorder options**: Up/down arrows on options to change sortOrder
  - **Search**: Filter groups and options by name
  - Uses `PATCH /modifiers/options/:id` and `POST /modifiers/options` APIs
- **validation**: Create a modifier option, edit its price, toggle default, reorder, delete. All changes persist.
- **agent**: coder
- **status**: Not Completed

### T6: Product ↔ Modifier Assignment
- **depends_on**: [T4]
- **location**: `apps/admin/src/app/(admin)/catalog/products/[id]/modifiers-tab.tsx`
- **description**: Build the Modifiers tab inside the product detail page. Features:
  - Show currently assigned modifier groups with inline expand to see options
  - "Add Modifier Group" button: searchable dropdown of all groups, attaches via `POST /modifiers/attach`
  - "Remove" button per group: detaches via `DELETE /modifiers/products/:productId/groups/:modifierGroupId`
  - Reorder assigned groups via drag or up/down
- **validation**: Attach a modifier group to a product, see its options, detach it, verify via API.
- **agent**: coder
- **status**: Not Completed

### T7: Products List Upgrade (search, filter, bulk actions)
- **depends_on**: [T3, T5]
- **location**: `apps/admin/src/app/(admin)/catalog/products/page.tsx`
- **description**: Upgrade products list to Shopify-level:
  - **Search bar**: Filter products by name in real-time
  - **Category filter**: Dropdown to filter by category
  - **Status filter**: All / Active / Archived tabs
  - **Product count per category**: Show in category dropdown
  - **Bulk selection**: Checkboxes on each row, "Select All", bulk actions (archive/restore selected)
  - **Click row**: Navigates to `/catalog/products/[id]` (the product detail page from T1)
  - **Image column**: Show product thumbnail if `imageUrl` exists
  - **Category badge**: Show category name as a badge
- **validation**: Search by name, filter by category, switch status tabs, select multiple products, bulk archive.
- **agent**: coder
- **status**: Not Completed

### T8: Sidebar Upgrade (dynamic counters + route structure)
- **depends_on**: [T4]
- **location**: `apps/admin/src/components/sidebar.tsx`, `apps/admin/src/app/(admin)/catalog/products/[id]/page.tsx`
- **description**: Update sidebar to show product/category/modifier counts fetched from API. Add "back to products" breadcrumb navigation for product detail pages. Ensure the `(admin)` layout includes a breadcrumb component that shows current path context.
- **validation**: Sidebar shows "34 Products", "6 Categories". Product detail page has back navigation.
- **agent**: coder
- **status**: Not Completed

### T9: Build Verification + Integration Test
- **depends_on**: [T7, T8]
- **location**: All admin pages
- **description**: Run `next build` to verify zero type errors. Test all routes return 200. Test real API interactions through the proxy: create a category, create a product, upload an image, attach a modifier, archive/restore. Verify all data flows correctly.
- **validation**: `next build` succeeds. All routes 200. CRUD operations work end-to-end against live VPS API.
- **agent**: tester
- **status**: Not Completed

## Parallel Execution Groups

| Wave | Tasks | Can Start When | Agent |
|------|-------|----------------|-------|
| 1 | T1, T2 | Immediately | 2 coders in parallel |
| 2 | T3, T4 | Wave 1 complete | 2 coders in parallel |
| 3 | T5 | T3 complete | 1 coder |
| 4 | T6 | T4 complete | 1 coder |
| 4 | T7 | T3, T5 complete | 1 coder |
| 4 | T8 | T4 complete | 1 coder |
| 5 | T9 | T7, T8 complete | tester |

## Agent Assignments

| Agent | Type | Tasks | Rationale |
|-------|------|-------|-----------|
| **Coder A** | coder | T1, T4, T6 | Product detail page, variants, modifier assignment — all product-focused, share state |
| **Coder B** | coder | T2, T3, T5 | Image upload component, category upgrade, modifier CRUD — shared components |
| **Coder A+B** | coder | T7 | Products list upgrade needs both product detail (from T1) and category (from T3) |
| **Coder A** | coder | T8 | Sidebar + breadcrumb, fast task |
| **Tester** | tester | T9 | Full integration verification |

## Key Decisions Made

1. **Product detail is a separate [id] page** (not a dialog) — Shopify uses full-page editors, not modals
2. **Images use existing `/media/upload` API** — no new backend work needed
3. **Prices in EUR** — the API already returns euros (9.95, not 995)
4. **Dev auth bypass remains** — login removed for local review, will be restored for VPS deploy
5. **No new API endpoints needed** — the existing NestJS API covers all CRUD operations
6. **`@base-ui/react` components** — use `render` prop, NOT `asChild` (learned from bugs)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `@base-ui/react` `asChild` vs `render` | Already documented and fixed. All new components must use `render` prop. |
| Drag-reorder without a library | Use simple up/down buttons initially; can add dnd later |
| Image upload CORS via proxy | Proxy already handles all auth forwarding |
| Product [id] page needs product data before render | Use Suspense boundary with skeleton loader |
| Parallel agents editing shared sidebar.tsx | T8 is Wave 4 — all other sidebar edits done by then |

## Approximate Time Estimate

| Wave | Duration | Parallel |
|------|----------|----------|
| Wave 1 (T1 + T2) | ~30 min | Yes |
| Wave 2 (T3 + T4) | ~30 min | Yes |
| Wave 3 (T5) | ~20 min | No |
| Wave 4 (T6 + T7 + T8) | ~30 min | Partial |
| Wave 5 (T9) | ~15 min | No |
| **Total** | **~2 hours** | |