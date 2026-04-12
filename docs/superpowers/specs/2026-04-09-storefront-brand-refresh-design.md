# Storefront Brand Refresh Design

**Date:** 2026-04-09  
**Scope:** `platform/apps/storefront` only

## Goal

Apply the real Tuckinn Proper brand to the customer storefront so the live ordering experience feels like a deliberate food brand instead of a generic app shell.

## Approved Direction

- Use the existing Tuckinn Proper logo mark already available in `platform/apps/storefront/public/logo.jpg` as the web-safe storefront asset. This is treated as the implementation source for the PDF logo the user provided.
- Reframe the storefront around a warm deli identity:
  - Deep red primary
  - Soft cream background
  - Espresso text
  - Restrained gold accent
- Keep the current ordering flow, cart flow, checkout flow, API calls, and admin/staff access behavior unchanged.

## Visual System

### Typography

- Replace the current generic Inter-only setup with a more intentional pairing:
  - `DM Sans` for body and UI copy
  - `Bebas Neue` for large display moments and section anchors
- Move title/SEO handling to Next metadata instead of hardcoding `<title>` inside JSX.

### Brand Surfaces

- Header:
  - Replace the `TI` placeholder block with the actual Tuckinn Proper logo image
  - Upgrade the header copy to reflect the brand, not just “Storefront”
  - Keep the header compact and mobile-safe
- Hero:
  - Keep the conversion-first structure
  - Add a larger branded panel anchored by the logo
  - Keep the “quickest route / basket visibility / meal deals” guidance, but present it with warmer brand styling
- Cards and controls:
  - Re-skin buttons, route cards, category cards, menu hero, and access hero with the new palette and surface system

### Iconography

- Remove emoji-style category icons from key navigation surfaces
- Use the existing Google Material icon font already loaded by the app for cleaner category markers

## UX Constraints

- Do not add friction to checkout
- Do not move or hide existing primary order actions
- Keep the main customer entry points obvious:
  - Browse the menu
  - Open meal deals
  - Build a sandwich
- Preserve mobile readability first, then desktop polish

## Files To Change

- `platform/apps/storefront/app/layout.tsx`
- `platform/apps/storefront/app/globals.css`
- `platform/apps/storefront/app/page.tsx`

## Verification

- `pnpm --filter @tuckinn/storefront build`
- Restart the storefront review server on port `7000`
- Manually confirm:
  - Header shows real logo
  - Hero reflects the Tuckinn Proper brand
  - Menu/category surfaces match the new palette
  - Checkout and access routes still render
