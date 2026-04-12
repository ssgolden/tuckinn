# Admin Brand Refresh Design

**Date:** 2026-04-09  
**Scope:** `platform/apps/admin` only

## Goal

Apply the same Tuckinn Proper brand system to the admin app, but adapt it for operations work instead of a customer storefront.

## Approved Direction

- Use the same logo, warm cream background, espresso text, deep red primary, and restrained gold accent used in the storefront refresh.
- Keep the admin experience calmer than the storefront:
  - stronger hierarchy
  - flatter, clearer surfaces
  - less decorative motion
  - higher readability for dense forms and edit panels
- Leave admin auth, catalog, product, media, modifier, and API behavior unchanged.

## Visual System

### Typography

- Reuse the storefront type pair:
  - `DM Sans` for UI/body
  - `Bebas Neue` for branded headers and key admin section titles
- Use display type more sparingly than storefront.

### Brand Surfaces

- Login shell:
  - add the logo
  - turn the sign-in surface into a branded admin entry shell
  - keep the form straightforward and high contrast
- Admin shell:
  - replace the generic control panel header with a Tuckinn Proper operations header
  - show signed-in identity in a calmer branded treatment
- Panels/stat cards/forms:
  - move from dark glass cards to cream panels with defined borders and softer shadows
  - keep dense content readable

## Implementation Strategy

- Use `globals.css` for root color/background tokens.
- Use `_admin/primitives.tsx` as the main style pivot so the shared panels, buttons, stat cards, and form controls all change consistently.
- Add only minimal JSX changes in `auth-shell.tsx` and `page.tsx` for logo placement and the top-of-page header shell.

## Files To Change

- `platform/apps/admin/app/layout.tsx`
- `platform/apps/admin/app/globals.css`
- `platform/apps/admin/app/_admin/primitives.tsx`
- `platform/apps/admin/app/_admin/auth-shell.tsx`
- `platform/apps/admin/app/page.tsx`
- `platform/apps/admin/public/logo.jpg`

## Guardrails

- No auth flow changes
- No CRUD logic changes
- No API contract changes
- No large admin page refactor beyond branded shell/layout updates

## Verification

- `pnpm --filter @tuckinn/admin build`
- Confirm the admin login shell and main dashboard compile and render with:
  - real logo
  - branded header
  - calmer cream/red/gold operations surfaces
