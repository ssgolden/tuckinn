# Admin Brand Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Tuckinn Proper brand system to the admin app in a calmer operations-focused presentation without changing admin behavior.

**Architecture:** Keep the existing admin page structure and data logic intact, but shift the visual system through the shared primitives layer and a small set of top-level layout/auth/header updates. Use the storefront brand palette and logo as the source of truth, then adapt them to high-density admin workflows with stronger contrast and cleaner surfaces.

**Tech Stack:** Next.js App Router, React client components, inline React style objects, `next/font/google`, `next/image`, global CSS, local public logo asset

---

### Task 1: Lock the admin brand spec

**Files:**
- Modify: `docs/superpowers/specs/2026-04-09-admin-brand-refresh-design.md`
- Modify: `docs/superpowers/plans/2026-04-09-admin-brand-refresh.md`

- [ ] Keep the work scoped to `platform/apps/admin`
- [ ] Preserve admin CRUD and auth behavior
- [ ] Use the same Tuckinn Proper logo and palette as the storefront

### Task 2: Add admin brand foundations

**Files:**
- Modify: `platform/apps/admin/app/layout.tsx`
- Modify: `platform/apps/admin/app/globals.css`
- Create: `platform/apps/admin/public/logo.jpg`

- [ ] Add proper metadata and font setup to the admin layout
- [ ] Add root brand tokens and background treatment in global CSS
- [ ] Copy the approved logo asset into the admin app public folder

### Task 3: Re-skin the shared primitive system

**Files:**
- Modify: `platform/apps/admin/app/_admin/primitives.tsx`

- [ ] Update shell, panel, stat card, button, input, list card, and status styles to the calmer branded ops system
- [ ] Keep existing component APIs unchanged so page logic does not need structural rewrites
- [ ] Preserve readability for dense admin forms and nested editing blocks

### Task 4: Brand the auth shell and dashboard header

**Files:**
- Modify: `platform/apps/admin/app/_admin/auth-shell.tsx`
- Modify: `platform/apps/admin/app/page.tsx`

- [ ] Add the logo to the login shell
- [ ] Replace the generic admin header with a Tuckinn Proper operations header
- [ ] Keep sign-in state, refresh, and sign-out behavior untouched

### Task 5: Verify the admin build

**Files:**
- Modify: none

- [ ] Run `pnpm --filter @tuckinn/admin build`
- [ ] Confirm the login shell and main dashboard compile on the new brand system
