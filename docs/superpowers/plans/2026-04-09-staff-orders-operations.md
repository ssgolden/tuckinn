# Staff Orders Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the staff order board for better kitchen/front-of-house workflow while hardening and verifying the live storefront-to-staff realtime order path.

**Architecture:** Keep the existing storefront checkout, payments, fulfillment board, and Socket.IO model. Improve the staff experience primarily in `platform/apps/staff`, then make targeted additive changes in the API so paid storefront orders and fulfillment transitions emit and surface reliably.

**Tech Stack:** Next.js App Router, React client components, Socket.IO client/server, NestJS, Prisma, global CSS or inline styles, existing Tuckinn Proper brand assets

---

### Task 1: Trace and verify the live order path

**Files:**
- Reference: `platform/apps/storefront/app/page.tsx`
- Reference: `platform/apps/api/src/checkout/checkout.service.ts`
- Reference: `platform/apps/api/src/payments/payments.service.ts`
- Reference: `platform/apps/api/src/fulfillment/fulfillment.service.ts`
- Reference: `platform/apps/api/src/realtime/realtime.gateway.ts`
- Reference: `platform/apps/staff/app/page.tsx`

- [ ] Confirm which payment paths move orders into `paid`
- [ ] Confirm where `board:refresh` and `order:updated` are emitted
- [ ] Record any missing or weak realtime guarantees before changing UI

### Task 2: Brand the staff shell

**Files:**
- Modify: `platform/apps/staff/app/layout.tsx`
- Modify: `platform/apps/staff/app/globals.css`
- Create: `platform/apps/staff/public/logo.jpg`

- [ ] Add metadata and branded fonts
- [ ] Add the Tuckinn Proper logo asset to the staff app
- [ ] Apply the calmer operations brand palette and background

### Task 3: Refactor the staff board into clearer UI sections

**Files:**
- Modify: `platform/apps/staff/app/page.tsx`
- Optional create: `platform/apps/staff/app/_staff/*`

- [ ] Split the oversized page into focused board sections if needed
- [ ] Improve the login shell, top header, filters, board lanes/groups, and empty states
- [ ] Add clearer status emphasis, urgency cues, and action hierarchy
- [ ] Preserve existing login, board fetch, note entry, and status update behavior

### Task 4: Harden fulfillment and realtime integration

**Files:**
- Modify: `platform/apps/api/src/fulfillment/fulfillment.service.ts`
- Modify: `platform/apps/api/src/realtime/realtime.gateway.ts`
- Modify: `platform/apps/api/src/payments/payments.service.ts`
- Optional modify: `platform/apps/api/src/fulfillment/fulfillment.controller.ts`

- [ ] Ensure payment success and fulfillment updates both emit reliable refresh/update events
- [ ] Add any needed additive board metadata for the improved staff UI
- [ ] Keep existing endpoint contracts backward compatible

### Task 5: Add verification coverage

**Files:**
- Create or modify: `platform/apps/api/src/fulfillment/*.spec.ts`
- Modify: existing payment and checkout specs as needed
- Optional create: staff E2E or integration tests under `platform/apps/staff`

- [ ] Cover storefront-paid order visibility in the active board
- [ ] Cover fulfillment transition effects on board membership and payloads
- [ ] Cover realtime emission expectations for payments and fulfillment changes

### Task 6: Validate end to end

**Files:**
- Modify: none

- [ ] Run API tests
- [ ] Run `pnpm --filter @tuckinn/staff build`
- [ ] Run `pnpm --filter @tuckinn/api build`
- [ ] Verify locally that live paid storefront orders appear in staff and status updates persist
