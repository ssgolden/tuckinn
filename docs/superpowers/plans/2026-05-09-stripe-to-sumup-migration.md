# Stripe → SumUp Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Stripe payment gateway with SumUp across the full Tuckinn platform (API + storefront), keeping the same checkout UX and webhook-based order confirmation flow.

**Architecture:** SumUp `online/custom` path — server creates a SumUp checkout object, storefront loads the SumUp Card Widget (iframe, no raw PAN handling), webhooks confirm payment status, backend verifies before marking order paid.

**Tech Stack:** NestJS (API), Next.js 15 + React 19 (storefront), Prisma (DB), SumUp Checkouts API v0.1, SumUp Card Widget JS.

---

## Pre-flight: Read the Docs

Before touching any code, load the SumUp LLM reference to verify all endpoints and field names.

- [ ] `curl https://developer.sumup.com/llms.txt` — note the relevant sections for online checkouts and webhooks
- [ ] Read `https://developer.sumup.com/online-payments/checkouts/index.md`
- [ ] Read `https://developer.sumup.com/online-payments/card-widget/index.md`
- [ ] Read `https://developer.sumup.com/online-payments/webhooks/index.md`
- [ ] Note the exact status values (`PENDING`, `PAID`, `FAILED`) and webhook event shape

---

## Credentials You Need Before Starting

Get these from the SumUp merchant dashboard before writing any code:

| Variable | Description |
|---|---|
| `SUMUP_API_KEY` | Server-side secret key (never expose to client) |
| `SUMUP_MERCHANT_CODE` | Merchant identifier (also visible in dashboard) |
| `SUMUP_CHECKOUT_REFERENCE_PREFIX` | Optional short prefix for checkout references (e.g. `TKN`) |

No publishable/client key needed — the Card Widget is loaded via a script tag with the checkout ID only.

---

## File Map

Every file touched, and why:

### Backend — `platform/apps/api/`

| File | Change |
|---|---|
| `src/payments/payments.service.ts` | Full rewrite of Stripe logic → SumUp API calls via `fetch` |
| `src/payments/sumup.client.ts` | **NEW** — thin SumUp HTTP client (create checkout, get checkout status) |
| `src/payments/dto/sumup-webhook.dto.ts` | **NEW** — DTO + Zod validation for SumUp webhook payload |
| `src/webhooks/webhooks.controller.ts` | Replace `/webhooks/stripe` endpoint with `/webhooks/sumup` |
| `src/checkout/dto/start-checkout.dto.ts` | Update `paymentProvider` enum default |
| `package.json` | Remove `stripe` dependency |

### Database — `platform/prisma/`

| File | Change |
|---|---|
| `schema.prisma` | Update `PaymentProvider` enum: `stripe` → `sumup` |
| `migrations/20260509_sumup_migration/` | **NEW** — Prisma migration for enum + any data backfill |

### Frontend — `platform/apps/storefront/`

| File | Change |
|---|---|
| `app/_storefront/client-page.tsx` | Replace `StripePaymentOverlay` / `StripeCheckoutForm` with `SumUpPaymentOverlay` |
| `package.json` | Remove `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| `app/layout.tsx` or `app/_storefront/client-page.tsx` | Add SumUp Card Widget `<script>` tag |

### Environment / Config

| File | Change |
|---|---|
| `platform/.env.example` | Replace `STRIPE_*` vars with `SUMUP_*` vars |
| `platform/.env` | Update dev placeholder values |
| `platform/.env.production` | Update VPS production values (also update on VPS) |

---

## Phase 1 — Backend: SumUp HTTP Client

### Task 1.1 — Remove Stripe, create SumUp client skeleton

- [ ] In `platform/apps/api/package.json`, remove `"stripe": "^22.0.0"` and run `pnpm install` (or `npm install` — check root package manager)
- [ ] Create `platform/apps/api/src/payments/sumup.client.ts` with this shape:

```typescript
// SumUp REST wrapper — all calls go server-to-server only
export interface SumUpCheckout {
  id: string;
  checkout_reference: string;
  amount: number;
  currency: string;
  merchant_code: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  redirect_url?: string;
}

export class SumUpClient {
  private readonly baseUrl = 'https://api.sumup.com/v0.1';
  constructor(private readonly apiKey: string) {}

  async createCheckout(params: {
    checkout_reference: string;
    amount: number;
    currency: string;
    merchant_code: string;
    description?: string;
    return_url: string;
  }): Promise<SumUpCheckout> { /* ... */ }

  async getCheckout(id: string): Promise<SumUpCheckout> { /* ... */ }
}
```

- [ ] Implement `createCheckout`: `POST /checkouts` with `Authorization: Bearer {apiKey}` header
- [ ] Implement `getCheckout`: `GET /checkouts/{id}`
- [ ] Write unit test `sumup.client.spec.ts` — mock `fetch`, assert correct headers and body shape
- [ ] Run test: `npm test -- sumup.client` — verify it passes
- [ ] Commit: `feat(payments): add SumUp HTTP client`

---

### Task 1.2 — Update environment config

- [ ] In `platform/.env.example`, replace:
  ```
  STRIPE_SECRET_KEY=replace-me
  STRIPE_WEBHOOK_SECRET=replace-me
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=replace-me
  ```
  with:
  ```
  SUMUP_API_KEY=replace-me
  SUMUP_MERCHANT_CODE=replace-me
  SUMUP_WEBHOOK_SECRET=replace-me
  ```
- [ ] Mirror the same change in `platform/.env` (use placeholder `sk_test` style values)
- [ ] Update `platform/.env.production` with your real SumUp credentials (get them from the dashboard)
- [ ] Commit: `chore(env): replace Stripe env vars with SumUp`

---

### Task 1.3 — Rewrite payments.service.ts

The existing service has ~800 lines. The rewrite removes the Stripe SDK and replaces with `SumUpClient`. Keep the same public method signatures so the checkout service doesn't change.

Key public methods to preserve (same signature, new implementation):
- `createCheckoutSession(order, payment, cart, amount, currency)` → calls `SumUpClient.createCheckout()`, returns `{ checkoutId, checkoutRef }` instead of `{ clientSecret, publishableKey }`
- `processSumUpWebhook(body, signature)` → validates HMAC, parses event, delegates to handlers
- `handleCheckoutCompleted(checkoutId)` → calls `SumUpClient.getCheckout()`, maps status → order state
- `handleCheckoutFailed(checkoutId)` → maps to order failure

Steps:
- [ ] Write a failing test in `payments.service.spec.ts` for `createCheckoutSession()` — mock `SumUpClient`, assert it receives correct amount/currency/reference
- [ ] Run: confirm test fails
- [ ] In `payments.service.ts`, replace the `Stripe` import and class field with `SumUpClient`
- [ ] Inject `SUMUP_API_KEY` and `SUMUP_MERCHANT_CODE` via `ConfigService`
- [ ] Implement `createCheckoutSession()` using `sumUpClient.createCheckout()`
- [ ] Return `{ checkoutId: checkout.id, checkoutRef: checkout.checkout_reference }` — the frontend needs the `checkoutId` to mount the Card Widget
- [ ] Run test: confirm it passes
- [ ] Write failing test for `processSumUpWebhook()` — assert it rejects invalid signatures
- [ ] Implement SumUp webhook HMAC-SHA256 validation (check SumUp docs for exact header name and algorithm — verify during pre-flight step)
- [ ] Implement event dispatch to `handleCheckoutCompleted` / `handleCheckoutFailed`
- [ ] Run test: confirm it passes
- [ ] Remove all remaining `stripe.*` references in the file
- [ ] Run full test suite: `npm test -- payments.service`
- [ ] Commit: `feat(payments): replace Stripe SDK with SumUp Checkouts API`

---

## Phase 2 — Database Migration

### Task 2.1 — Update Prisma schema

- [ ] In `platform/prisma/schema.prisma`, find the `PaymentProvider` enum:
  ```prisma
  enum PaymentProvider {
    stripe
  }
  ```
  Change to:
  ```prisma
  enum PaymentProvider {
    sumup
  }
  ```
- [ ] If the `Payment` model has any Stripe-specific fields (e.g. `providerIntentId` was named for Stripe), rename to generic names like `providerCheckoutId`, `providerTransactionId`
- [ ] Run: `npx prisma migrate dev --name sumup_migration`
  - If existing `stripe` rows exist in dev DB, Prisma will error on the enum rename — add a migration step to `UPDATE "Payment" SET provider = 'sumup' WHERE provider = 'stripe'` before the enum rename, or drop and re-seed your dev database
- [ ] Run: `npx prisma generate`
- [ ] Run existing DB-related tests to check for breakage
- [ ] Commit: `refactor(db): rename PaymentProvider enum stripe→sumup`

---

## Phase 3 — Webhook Controller

### Task 3.1 — Replace Stripe webhook endpoint with SumUp

File: `platform/apps/api/src/webhooks/webhooks.controller.ts`

Current:
```typescript
@Post("stripe")
async handleStripeWebhook(...) { ... }
```

Replace with:
- [ ] Write failing test: `POST /webhooks/sumup` with invalid signature → 400
- [ ] Add `@Post("sumup")` handler that reads raw body + `x-sumup-signature` header (verify header name in SumUp docs)
- [ ] Call `paymentsService.processSumUpWebhook(rawBody, signature)`
- [ ] Remove `@Post("stripe")` handler
- [ ] Run test: confirm it passes
- [ ] Commit: `feat(webhooks): replace Stripe webhook with SumUp endpoint`

### Task 3.2 — Create SumUp webhook DTO

File: `platform/apps/api/src/payments/dto/sumup-webhook.dto.ts`

- [ ] Define Zod schema matching SumUp webhook payload (from pre-flight docs read):
  ```typescript
  export const SumUpWebhookSchema = z.object({
    id: z.string(),
    event_type: z.enum(['CHECKOUT_STATUS_CHANGED']),
    payload: z.object({
      checkout_id: z.string(),
      status: z.enum(['PENDING', 'PAID', 'FAILED']),
      merchant_code: z.string(),
      amount: z.number(),
      currency: z.string(),
      checkout_reference: z.string(),
    }),
  });
  ```
  Adjust based on actual SumUp webhook shape from docs.
- [ ] Commit: `feat(payments): add SumUp webhook DTO`

---

## Phase 4 — Checkout Service Update

### Task 4.1 — Update checkout flow response

File: `platform/apps/api/src/checkout/checkout.service.ts`

The checkout service currently calls `paymentsService.createCheckoutSession()` and expects `{ clientSecret, publishableKey }` back from Stripe. After Phase 1, it now returns `{ checkoutId, checkoutRef }`.

- [ ] Find where the checkout service maps the payment result to the HTTP response (around line 172-187)
- [ ] Update the return shape to:
  ```typescript
  return {
    orderNumber: order.orderNumber,
    payment: {
      checkoutId: paymentResult.checkoutId,  // frontend needs this for Card Widget
    }
  };
  ```
- [ ] Update `start-checkout.dto.ts` — change `paymentProvider` default from `stripe` to `sumup`
- [ ] Run `npm test -- checkout.service` — fix any failures
- [ ] Commit: `feat(checkout): return SumUp checkoutId instead of Stripe clientSecret`

---

## Phase 5 — Frontend: Replace Stripe Elements with SumUp Card Widget

### Task 5.1 — Remove Stripe packages

File: `platform/apps/storefront/package.json`

- [ ] Remove:
  - `"@stripe/react-stripe-js": "^6.1.0"`
  - `"@stripe/stripe-js": "^9.1.0"`
- [ ] Run `pnpm install` (or `npm install`) in the storefront directory
- [ ] Confirm build still starts (will have type errors, fix in next task)

### Task 5.2 — Add SumUp Card Widget script

The SumUp Card Widget loads via a `<script>` tag. It's not a React component.

File: `platform/apps/storefront/app/layout.tsx` (or wherever `<head>` is managed)

- [ ] Add:
  ```tsx
  <Script
    src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
    strategy="lazyOnload"
  />
  ```
  Use Next.js `<Script>` component (import from `'next/script'`).
- [ ] Add TypeScript global type declaration for `SumUpCard` (the widget mounts itself on `window`):
  ```typescript
  // types/sumup.d.ts
  interface Window {
    SumUpCard: {
      mount(config: {
        id: string;
        checkoutId: string;
        onResponse: (type: string, body: unknown) => void;
      }): void;
      unmount(): void;
    };
  }
  ```
- [ ] Commit: `feat(storefront): add SumUp Card Widget script`

### Task 5.3 — Replace StripePaymentOverlay with SumUpPaymentOverlay

File: `platform/apps/storefront/app/_storefront/client-page.tsx`

This is the largest frontend change. Current state:
- `StripePaymentOverlay` (lines ~644-673): loads Stripe via `loadStripe(publishableKey)`, wraps `<Elements>`
- `StripeCheckoutForm` (lines ~675-746): uses `useStripe()`, `useElements()`, `CardElement`, calls `stripe.confirmCardPayment()`

Replace with:

- [ ] Remove all imports: `import { loadStripe } from "@stripe/stripe-js"`, `import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"`

- [ ] Remove the `pendingPayment` state shape fields `publishableKey` and `clientSecret` — replace with `checkoutId`:
  ```typescript
  // Before
  pendingPayment: { clientSecret: string; publishableKey: string; orderNumber: string }
  // After
  pendingPayment: { checkoutId: string; orderNumber: string }
  ```

- [ ] Write new `SumUpPaymentOverlay` component:
  ```tsx
  function SumUpPaymentOverlay({ checkoutId, orderNumber, onClose }: {
    checkoutId: string;
    orderNumber: string;
    onClose: () => void;
  }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!window.SumUpCard || !containerRef.current) return;
      window.SumUpCard.mount({
        id: containerRef.current.id,
        checkoutId,
        onResponse(type, body) {
          if (type === 'success') {
            // Redirect to success page — server webhook will have confirmed payment
            window.location.href = `?payment=success&order=${orderNumber}`;
          } else if (type === 'error') {
            window.location.href = `?payment=cancelled&order=${orderNumber}`;
          }
        },
      });
      return () => { window.SumUpCard?.unmount(); };
    }, [checkoutId, orderNumber]);

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-[#111] rounded-xl p-6 w-full max-w-md">
          <div id="sumup-card" ref={containerRef} />
          <button onClick={onClose} className="mt-4 text-sm text-gray-400 underline">
            Cancel
          </button>
        </div>
      </div>
    );
  }
  ```

  Note: Verify the exact SumUp Card Widget mount API against the docs (pre-flight step). The `id` and `checkoutId` field names may differ.

- [ ] Update `handleCheckout()` (lines ~578-642): change `clientSecret + publishableKey` check to `checkoutId`:
  ```typescript
  if (result.payment?.checkoutId) {
    setPendingPayment({ checkoutId: result.payment.checkoutId, orderNumber: result.orderNumber });
  }
  ```

- [ ] Replace `{pendingPayment && <StripePaymentOverlay ... />}` render with `<SumUpPaymentOverlay ... />`

- [ ] Run TypeScript check: `npx tsc --noEmit` — fix all errors before continuing
- [ ] Run `npm run dev` in storefront, open `http://localhost:3100`, manually test the checkout flow end-to-end (see testing section)
- [ ] Commit: `feat(storefront): replace Stripe Elements with SumUp Card Widget`

---

## Phase 6 — Testing

### Task 6.1 — Backend integration test

- [ ] In `platform/tests/` (or nearest integration test dir), write a test for the full checkout flow:
  1. POST `/api/carts` → create cart
  2. POST `/api/carts/{id}/items` → add item
  3. POST `/api/checkout/start` → get `checkoutId` back (assert it's a non-empty string)
  4. Simulate SumUp webhook `POST /webhooks/sumup` with correct HMAC + `PAID` status
  5. Assert order status becomes `confirmed`

- [ ] Use a test SumUp sandbox account (create at developer.sumup.com) or mock the SumUp client for integration tests
- [ ] Run: `npm test -- integration`
- [ ] Commit: `test(integration): add SumUp checkout end-to-end test`

### Task 6.2 — Manual storefront smoke test

On dev server (`npm run dev`):

- [ ] Open the storefront → add items to cart → click checkout
- [ ] Fill checkout form → submit → SumUp Card Widget should appear in modal
- [ ] Use SumUp test card: `4000000000000002` (or check sandbox docs for test cards)
- [ ] Confirm success redirect to `?payment=success&order=...`
- [ ] Check the admin panel — order should appear as confirmed
- [ ] Repeat with a declined card (check SumUp test card for failures)
- [ ] Confirm failure redirect and order stays in pending/failed state

### Task 6.3 — Deliberate failure cases (per SumUp skill checklist)

- [ ] Test with `amount = 11` in test mode (SumUp sandbox failure trigger — verify in docs)
- [ ] Test duplicate `checkout_reference` — assert server returns 409 or reuses existing checkout
- [ ] Test webhook retry with same event ID — assert idempotent handling (no double order confirmation)
- [ ] Test session expiry (let the checkout modal sit for 15 minutes or simulate via API)

---

## Phase 7 — VPS Deployment

### Task 7.1 — Update VPS environment

- [ ] SSH to VPS: `ssh root@187.124.217.8`
- [ ] Edit `/opt/tuckinn/platform.release_20260409_003502/.env.production`:
  - Remove `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Add `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`, `SUMUP_WEBHOOK_SECRET` with real production values
- [ ] **Do not commit production secrets to git** — update VPS env directly via SSH

### Task 7.2 — Register SumUp webhook on the merchant dashboard

- [ ] Log into SumUp merchant dashboard → Developer → Webhooks
- [ ] Add webhook URL: `https://api.tuckinnproper.es/webhooks/sumup` (adjust subdomain to match your Caddy config)
- [ ] Select event: `CHECKOUT_STATUS_CHANGED`
- [ ] Copy the webhook secret → paste into VPS `.env.production` as `SUMUP_WEBHOOK_SECRET`

### Task 7.3 — Deploy

VPS is not a git repo — use the deploy script:
- [ ] From local machine: `bash platform/infra/docker/deploy-vps.sh`
  - Or manually: `scp` changed files, then `docker compose -f docker-compose.prod.yml build api storefront && docker compose up -d`
- [ ] Watch logs: `docker compose logs -f api` — confirm no Stripe-related startup errors
- [ ] Hit `https://tuckinnproper.es` → do one live test checkout with a real card
- [ ] Confirm order appears in admin as confirmed

### Task 7.4 — Cleanup

- [ ] Remove `P0-STRIPE-ACTIVATION-GUIDE.md` from the project root (no longer relevant)
- [ ] Search codebase for any remaining `stripe` references: `grep -ri "stripe" platform/apps --include="*.ts" --include="*.tsx" --include="*.json"` — fix any stragglers
- [ ] Commit: `chore: remove Stripe references and activation guide`

---

## Checklist Summary

| Phase | Status |
|---|---|
| Pre-flight: read SumUp docs | - [ ] |
| Get SumUp credentials | - [ ] |
| Phase 1: SumUp HTTP client + payments.service rewrite | - [ ] |
| Phase 2: Prisma migration | - [ ] |
| Phase 3: Webhook controller | - [ ] |
| Phase 4: Checkout service | - [ ] |
| Phase 5: Frontend Card Widget | - [ ] |
| Phase 6: Tests | - [ ] |
| Phase 7: VPS deploy | - [ ] |

---

## Rollback Plan

If SumUp goes wrong after deploy:
1. Restore Stripe env vars on VPS (`sk_test_...` keys are still in your password manager)
2. Revert the deploy to the previous Docker image tag (check `docker images` on VPS for the previous `platform_api` tag)
3. The DB migration (enum rename) is the trickiest to roll back — keep a DB snapshot before deploying (`pg_dump`) so you can restore if needed
