# Plan: Fix Missing Products + Full Admin Feature Parity

**Generated:** 2026-04-13
**Agents:** 5 parallel (Coder A, Coder B, Coder C, Coder D, Tester)

## Root Cause Found

Products API returns `category: {id, name}` but **no `slug`** field. Categories match by `slug` → all 34 products fall through as "unmatched" → "no products" under every category.

## Agent Assignments & Tasks

### AGENT A: Fix Category-Product Matching (CRITICAL)

**Files:** `apps/admin/src/app/(admin)/catalog/categories/page.tsx`, `apps/admin/src/app/(admin)/catalog/products/page.tsx`, `apps/admin/src/app/(admin)/catalog/products/[id]/page.tsx`

**What to do:**
1. Change product type to use `category.id` (not `slug`) for matching — products return `{id, name}` so match on `id`
2. In categories page: `getProductsForCategory(cat.id)` instead of `cat.slug`
3. In products page: filter dropdown uses category `id` not `slug`
4. In product detail page: category select uses `id` not `slug`
5. Update all `sampleProducts` and `sampleCategories` to use matching IDs
6. Verify all 34 products appear under correct categories

**Validation:** Open `/catalog/categories` → click "Show Products" on Meal Deals → see 4 products. Same for all 6 categories.

---

### AGENT B: Modifier Groups — Full Inline CRUD for Options

**Files:** `apps/admin/src/app/(admin)/catalog/modifiers/page.tsx`

**What to do:**
1. Add "Add Option" button inside each modifier group card
2. Add inline editing for option fields: name, priceDeltaAmount, isDefault, isActive
3. Add delete option button (with confirmation)
4. Wire up to API endpoints:
   - `POST /modifiers/options` (create option, body: `{modifierGroupId, name, priceDeltaAmount, isDefault, isActive}`)
   - `PATCH /modifiers/options/:id` (update option)
5. Add up/down reorder buttons for options (update sortOrder)
6. Show prices in EUR format (already fixed)
7. Each option row shows: name, price delta, default badge, active badge, edit/delete buttons

**Validation:** Create a new option in "Bread Choice", edit its name and price, toggle it as default, delete it. All changes persist via API.

---

### AGENT C: Dashboard + Orders + Tables Data Accuracy

**Files:**
- `apps/admin/src/app/(admin)/page.tsx` — Dashboard
- `apps/admin/src/app/(admin)/orders/page.tsx` — Orders
- `apps/admin/src/app/(admin)/tables/page.tsx` — Tables

**What to do:**
1. **Dashboard**: Fetch real counts from API (categories, products, modifier groups). Remove sample fallback data — show actual numbers or "—" if not connected.
2. **Orders**: Wire to real `/fulfillment/board` and `/orders` endpoints. Show real order numbers, statuses, table names, amounts in EUR. Add scope selector (active/history/all).
3. **Tables**: Fetch real tables from API endpoint (check if `/tables` exists on API — if not, keep the 15-table sample but add a note that CRUD API is coming). Update sample data to use real EUR prices matching the storefront.

**Validation:** Dashboard shows "6 Categories, 34 Products, 6 Modifier Groups, 15 Tables". Orders page shows real fulfillment data (or proper empty state with note).

---

### AGENT D: Product Detail Page Polish + Variant/Modifier Tabs

**Files:** `apps/admin/src/app/(admin)/catalog/products/[id]/page.tsx`

**What to do:**
1. Fix the Product type to include full category `id` and `name` (not slug)
2. Make the Variants tab fully functional:
   - Add variant: POST new variant via `PATCH /catalog/products/:id` with updated variants array
   - Edit variant name/price inline
   - Set default variant (radio button)
   - Delete variant (with confirmation)
3. Make the Modifiers tab fully functional:
   - Show assigned modifier groups with expandable option lists
   - "Add Modifier Group" shows available groups as chips/buttons
   - Attach: `POST /modifiers/attach` with `{locationCode, productSlug, modifierGroupId}`
   - Detach: `DELETE /modifiers/products/:productId/groups/:modifierGroupId`
4. Make image upload actually work via proxy: `POST /api/proxy/media/upload` with `Authorization: Bearer {token}`
5. Add delete product button (only visible for archived products)

**Validation:** Open a product → see real data. Edit variant price → save → reload → price persists. Attach a modifier group → it appears. Detach → it disappears.

---

### AGENT E: Build Verification + Integration Testing

**Files:** All admin pages

**What to do (after A-D complete):**
1. Run `npx next build` — must pass with zero type errors
2. Verify all 14 routes return 200 on localhost
3. Test the full flow:
   - Categories page → expand Meal Deals → see 4 products
   - Click a product → product detail page loads with real data
   - Category filter on products page works
   - Modifiers page shows all 6 groups with options
   - Orders page shows real data or proper empty state
4. Test the proxy + real API:
   - Login via proxy returns real token
   - Category list returns 6 categories
   - Products list returns 34 products
   - Product-category matching works by ID
5. Document any remaining issues

**Validation:** Build compiles. All routes 200. Real data flows end-to-end. Zero console errors in browser.

## Execution Order

```
Wave 1:  AGENT A + AGENT B + AGENT C + AGENT D  (all parallel, no deps)
Wave 2:  AGENT E (after all A-D complete)
```

## @base-ui/react REMINDER

All components use `render` prop, NOT `asChild`. Never use `asChild` with @base-ui/react components (DialogTrigger, CollapsibleTrigger, SheetTrigger, etc.). This was the root cause of the original VPS 404 bug.

## Price Format Reminder

API returns prices in **EUR** (e.g., `9.95`, not `995`). All `formatPrice` functions must use `€${Number(amount).toFixed(2)}` without division.