# Phase 3 Web App Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break the monolithic storefront and admin pages into focused modules without changing user-visible behavior, then verify the web apps still build cleanly.

**Architecture:** Keep the current Next.js App Router pages and existing API contracts intact. Phase 3 extracts pure storefront logic, isolated UI sections, admin form primitives, and dashboard sections into internal modules so later feature work can land in smaller files with cleaner ownership.

**Tech Stack:** Next.js 15 App Router, React 19 client components, TypeScript, pnpm workspace, shared app-local API clients

---

## File Structure Map

- Create: `platform/apps/storefront/app/_storefront/catalog.ts`
- Create: `platform/apps/storefront/app/_storefront/access-view.tsx`
- Modify: `platform/apps/storefront/app/page.tsx`
- Create: `platform/apps/admin/app/_admin/types.ts`
- Create: `platform/apps/admin/app/_admin/primitives.tsx`
- Create: `platform/apps/admin/app/_admin/auth-shell.tsx`
- Modify: `platform/apps/admin/app/page.tsx`

---

### Task 1: Extract Storefront Domain Helpers

**Files:**
- Create: `platform/apps/storefront/app/_storefront/catalog.ts`
- Modify: `platform/apps/storefront/app/page.tsx`

- [ ] **Step 1: Move storefront helper types and pure functions into an internal module**

Create `catalog.ts` with:
- `ProductSelectionState`
- `Category`, `Product`, `ModifierGroup`
- `StorefrontView`, `MenuFilter`
- `MENU_FILTERS`
- `buildInitialSelections`
- `getDefaultOptionIds`
- `getSelectedCount`
- `getMissingGroups`
- `getSelectionLabel`
- `getProductPrice`
- `getFilteredProducts`
- `getCategorySummary`
- `getCategoryMixLabel`
- `formatMoney`

- [ ] **Step 2: Update `page.tsx` imports to consume the new module**

Replace the top-level local type/function declarations with imports from `./_storefront/catalog`.

- [ ] **Step 3: Verify the storefront build still passes**

Run:

```powershell
pnpm --filter @tuckinn/storefront build
```

Expected:
- PASS

---

### Task 2: Extract Storefront Access View

**Files:**
- Create: `platform/apps/storefront/app/_storefront/access-view.tsx`
- Modify: `platform/apps/storefront/app/page.tsx`

- [ ] **Step 1: Create a dedicated access view component**

Move the `view === "access"` UI block into `access-view.tsx` and keep the page responsible for state and handlers only.

- [ ] **Step 2: Replace inline JSX in `page.tsx` with the new component**

Pass:
- current back-office session
- auth form values
- auth state message/tone
- pending state
- field update callbacks
- submit/logout callbacks
- dashboard launcher callback

- [ ] **Step 3: Rebuild the storefront**

Run:

```powershell
pnpm --filter @tuckinn/storefront build
```

Expected:
- PASS

---

### Task 3: Extract Admin Shared Types And Primitives

**Files:**
- Create: `platform/apps/admin/app/_admin/types.ts`
- Create: `platform/apps/admin/app/_admin/primitives.tsx`
- Modify: `platform/apps/admin/app/page.tsx`

- [ ] **Step 1: Move dashboard data types into `types.ts`**

Extract:
- `Category`
- `Product`
- `ModifierGroup`
- `DashboardState`
- `INITIAL_STATE`

- [ ] **Step 2: Move shared UI helpers into `primitives.tsx`**

Extract:
- `Panel`
- `StatCard`
- `TextInput`
- `TextArea`
- `SelectInput`
- `CheckboxInput`
- `FileInput`
- `formatCurrency`

- [ ] **Step 3: Update `page.tsx` to import those shared pieces**

Keep runtime behavior identical.

- [ ] **Step 4: Verify the admin build**

Run:

```powershell
pnpm --filter @tuckinn/admin build
```

Expected:
- PASS

---

### Task 4: Extract Admin Auth Shell

**Files:**
- Create: `platform/apps/admin/app/_admin/auth-shell.tsx`
- Modify: `platform/apps/admin/app/page.tsx`

- [ ] **Step 1: Move bootstrapping and signed-out shells into `auth-shell.tsx`**

Extract the two early-return branches:
- session restore shell
- login form shell

- [ ] **Step 2: Keep page logic focused on authenticated dashboard behavior**

Pass the current login state, form state, handlers, and API target into the new auth shell component.

- [ ] **Step 3: Verify the admin build again**

Run:

```powershell
pnpm --filter @tuckinn/admin build
```

Expected:
- PASS

---

### Task 5: Full Phase Verification

**Files:**
- Test only: `platform/apps/storefront/app/page.tsx`
- Test only: `platform/apps/admin/app/page.tsx`

- [ ] **Step 1: Run focused app builds**

Run:

```powershell
pnpm --filter @tuckinn/storefront build
pnpm --filter @tuckinn/admin build
```

Expected:
- PASS

- [ ] **Step 2: Run the workspace build**

Run:

```powershell
pnpm build
```

Expected:
- PASS with the same non-blocking global `turbo` warning already seen in earlier phases.
