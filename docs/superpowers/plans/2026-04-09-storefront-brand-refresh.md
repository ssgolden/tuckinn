# Storefront Brand Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Tuckinn Proper brand to the storefront without changing order, cart, checkout, or back-office session behavior.

**Architecture:** Keep the storefront as a single App Router page for now, but replace the placeholder brand shell with the real logo asset, a proper metadata setup, and a consistent token-driven visual system. Use CSS variable changes plus targeted JSX updates so the refresh reaches the real conversion surfaces without reopening unrelated product logic.

**Tech Stack:** Next.js App Router, React client component, `next/image`, global CSS, existing local `public/logo.jpg` asset

---

### Task 1: Document and lock the brand system

**Files:**
- Modify: `docs/superpowers/specs/2026-04-09-storefront-brand-refresh-design.md`
- Modify: `docs/superpowers/plans/2026-04-09-storefront-brand-refresh.md`
- Reference: `design-system/tuckinn-storefront/MASTER.md`

- [ ] Confirm the persisted design system still matches the approved direction
- [ ] Keep the implementation scoped to storefront-only changes
- [ ] Preserve the real logo asset path at `platform/apps/storefront/public/logo.jpg`

### Task 2: Upgrade layout metadata and typography

**Files:**
- Modify: `platform/apps/storefront/app/layout.tsx`

- [ ] Replace inline `<title>` handling with a `metadata` export
- [ ] Switch to intentional brand fonts using `next/font/google`
- [ ] Keep the Material icon font available for category navigation markers
- [ ] Point icons metadata at the existing storefront logo asset

### Task 3: Implement branded header and hero

**Files:**
- Modify: `platform/apps/storefront/app/page.tsx`
- Modify: `platform/apps/storefront/app/globals.css`

- [ ] Replace the fake `TI` logo block with `next/image` using `/logo.jpg`
- [ ] Update visible brand copy from generic storefront language to Tuckinn Proper branding
- [ ] Keep the existing home/menu/builder/basket/access routing behavior intact
- [ ] Upgrade the hero with a branded mark panel, stronger display type, and warm supporting surfaces

### Task 4: Clean up navigation visuals

**Files:**
- Modify: `platform/apps/storefront/app/page.tsx`
- Modify: `platform/apps/storefront/app/globals.css`

- [ ] Replace emoji category icons with Material icon names from `getCategoryIcon()`
- [ ] Style category/drawer icons so they look consistent on light surfaces
- [ ] Keep existing category selection and drawer behavior unchanged

### Task 5: Apply the palette across live ordering surfaces

**Files:**
- Modify: `platform/apps/storefront/app/globals.css`

- [ ] Rework root tokens to warm cream, red, espresso, and gold values
- [ ] Refresh cards, menu hero, form fields, and access surfaces to match the new brand
- [ ] Preserve contrast and focus visibility for keyboard navigation
- [ ] Keep mobile layout stable and add desktop polish only where safe

### Task 6: Verify and refresh localhost review

**Files:**
- Modify: none

- [ ] Run `pnpm --filter @tuckinn/storefront build`
- [ ] Restart the storefront process on port `7000` so the user sees the new build
- [ ] Confirm the header logo, hero styling, menu sections, and checkout route still render
