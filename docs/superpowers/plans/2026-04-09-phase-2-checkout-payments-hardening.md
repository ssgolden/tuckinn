# Phase 2 Checkout And Payments Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add checkout and payment regression coverage, tighten request validation, and verify webhook/payment state transitions without changing the overall checkout architecture.

**Architecture:** Keep the current PaymentIntent-based checkout flow intact. Phase 2 adds tests around the existing service boundaries in `checkout`, `payments`, and `webhooks`, then applies the minimum production changes needed to make those tests pass and to harden validation.

**Tech Stack:** NestJS 10, Jest, ts-jest, TypeScript, Prisma service mocks, class-validator

---

## File Structure Map

- Create: `platform/apps/api/src/checkout/dto/start-checkout.dto.spec.ts`
- Create: `platform/apps/api/src/checkout/checkout.service.spec.ts`
- Create: `platform/apps/api/src/payments/payments.service.spec.ts`
- Create: `platform/apps/api/src/webhooks/webhooks.controller.spec.ts`
- Modify: `platform/apps/api/src/checkout/dto/start-checkout.dto.ts`
- Modify: `platform/apps/api/src/payments/payments.service.ts`
- Modify: `platform/apps/api/package.json` only if a Jest script/config adjustment is required

---

### Task 1: Establish API Test Baseline

**Files:**
- Create: `platform/apps/api/src/checkout/dto/start-checkout.dto.spec.ts`
- Create: `platform/apps/api/src/checkout/checkout.service.spec.ts`
- Create: `platform/apps/api/src/payments/payments.service.spec.ts`
- Create: `platform/apps/api/src/webhooks/webhooks.controller.spec.ts`

- [ ] **Step 1: Verify the current red baseline**

Run:

```powershell
pnpm --filter @tuckinn/api test -- --runInBand
```

Expected:

```text
No tests found, exiting with code 1
```

- [ ] **Step 2: Add a DTO validation spec for customer email**

Create:

```ts
import { validate } from "class-validator";
import { StartCheckoutDto } from "./start-checkout.dto";

function buildDto(overrides: Partial<StartCheckoutDto> = {}) {
  return Object.assign(new StartCheckoutDto(), {
    cartId: "550e8400-e29b-41d4-a716-446655440000",
    idempotencyKey: "checkout-key-123",
    orderKind: "collect",
    customerName: "Test Customer",
    ...overrides
  });
}

describe("StartCheckoutDto", () => {
  it("rejects invalid customerEmail values", async () => {
    const dto = buildDto({ customerEmail: "not-an-email" });
    const errors = await validate(dto);

    expect(errors.some(error => error.property === "customerEmail")).toBe(true);
  });
});
```

- [ ] **Step 3: Run the DTO spec and verify it fails for the right reason**

Run:

```powershell
pnpm --filter @tuckinn/api test -- src/checkout/dto/start-checkout.dto.spec.ts --runInBand
```

Expected:
- FAIL because `customerEmail` is currently validated as a plain string, not an email.

---

### Task 2: Harden Checkout DTO Validation

**Files:**
- Modify: `platform/apps/api/src/checkout/dto/start-checkout.dto.ts`
- Test: `platform/apps/api/src/checkout/dto/start-checkout.dto.spec.ts`

- [ ] **Step 1: Add the minimum validation change**

Update the DTO:

```ts
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength
} from "class-validator";
```

And:

```ts
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  customerEmail?: string;
```

- [ ] **Step 2: Re-run the DTO spec**

Run:

```powershell
pnpm --filter @tuckinn/api test -- src/checkout/dto/start-checkout.dto.spec.ts --runInBand
```

Expected:
- PASS

- [ ] **Step 3: Add a valid-email control case**

Append:

```ts
  it("accepts a valid customerEmail", async () => {
    const dto = buildDto({ customerEmail: "customer@example.com" });
    const errors = await validate(dto);

    expect(errors.some(error => error.property === "customerEmail")).toBe(false);
  });
```

- [ ] **Step 4: Re-run the DTO spec**

Run:

```powershell
pnpm --filter @tuckinn/api test -- src/checkout/dto/start-checkout.dto.spec.ts --runInBand
```

Expected:
- PASS with both DTO tests green.

---

### Task 3: Add Checkout Service Regression Tests

**Files:**
- Create: `platform/apps/api/src/checkout/checkout.service.spec.ts`
- Test: `platform/apps/api/src/checkout/checkout.service.ts`

- [ ] **Step 1: Add a failing idempotency regression test**

Create:

```ts
import { CheckoutService } from "./checkout.service";

describe("CheckoutService", () => {
  it("returns the existing checkout when the idempotency key already exists", async () => {
    const existingCheckout = {
      order: { id: "order-1" },
      payment: { id: "payment-1" }
    };

    const prisma = {} as any;
    const paymentsService = {
      getCheckoutStateByIdempotencyKey: jest.fn().mockResolvedValue(existingCheckout)
    } as any;

    const service = new CheckoutService(prisma, paymentsService);

    await expect(
      service.startCheckout({
        cartId: "550e8400-e29b-41d4-a716-446655440000",
        idempotencyKey: "checkout-key-123",
        orderKind: "collect",
        customerName: "Test Customer"
      } as any)
    ).resolves.toEqual(existingCheckout);
  });
});
```

- [ ] **Step 2: Run the checkout spec**

Run:

```powershell
pnpm --filter @tuckinn/api test -- src/checkout/checkout.service.spec.ts --runInBand
```

Expected:
- PASS or FAIL only if the service contract differs from the test.
- If it passes immediately, extend the spec with a missing-behavior test before touching production code.

- [ ] **Step 3: Add one true red test for validation behavior**

Append:

```ts
  it("rejects checkout when the cart does not exist", async () => {
    const prisma = {
      cart: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    } as any;
    const paymentsService = {
      getCheckoutStateByIdempotencyKey: jest.fn().mockResolvedValue(null),
      ensureProviderConfigured: jest.fn()
    } as any;

    const service = new CheckoutService(prisma, paymentsService);

    await expect(
      service.startCheckout({
        cartId: "550e8400-e29b-41d4-a716-446655440000",
        idempotencyKey: "checkout-key-123",
        orderKind: "collect",
        customerName: "Test Customer"
      } as any)
    ).rejects.toThrow("Cart not found.");
  });
```

- [ ] **Step 4: Run the checkout spec again**

Run:

```powershell
pnpm --filter @tuckinn/api test -- src/checkout/checkout.service.spec.ts --runInBand
```

Expected:
- PASS if current behavior matches.
- If any expectation is wrong, update the test to reflect the real contract before expanding coverage.

---

### Task 4: Add Payments Service Safety Tests

**Files:**
- Create: `platform/apps/api/src/payments/payments.service.spec.ts`
- Test: `platform/apps/api/src/payments/payments.service.ts`

- [ ] **Step 1: Add a provider-guard test**

Create:

```ts
import { ServiceUnavailableException } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
  function buildService(overrides: Partial<ConstructorParameters<typeof PaymentsService>[0]> = {}) {
    const prisma = {} as any;
    const configService = {
      get: jest.fn()
    } as any;
    const realtimeGateway = {
      emitOrderUpdated: jest.fn(),
      emitBoardRefresh: jest.fn()
    } as any;

    return new PaymentsService(prisma, configService, realtimeGateway);
  }

  it("rejects non-stripe providers", () => {
    const service = buildService();

    expect(() => service.ensureProviderConfigured("adyen" as any)).toThrow(
      ServiceUnavailableException
    );
  });
});
```

- [ ] **Step 2: Add a mock-payment regression test**

Append:

```ts
  it("uses mock payment initialization when Stripe is absent and mock payments are enabled", async () => {
    const payment = {
      id: "payment-1",
      order: {
        metadata: { cartId: "cart-1" }
      }
    };

    const prisma = {
      payment: { findUnique: jest.fn().mockResolvedValue(payment) },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<any>) =>
        callback({
          payment: { update: jest.fn().mockResolvedValue({ id: "payment-1", provider: "stripe", status: "paid", currencyCode: "EUR" }) },
          paymentEvent: { create: jest.fn().mockResolvedValue(undefined) },
          order: { update: jest.fn().mockResolvedValue(undefined) },
          cart: { update: jest.fn().mockResolvedValue(undefined) }
        })
      )
    } as any;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "ALLOW_MOCK_PAYMENTS") return "true";
        if (key === "STRIPE_SECRET_KEY") return "replace-me";
        return undefined;
      })
    } as any;
    const realtimeGateway = {
      emitOrderUpdated: jest.fn(),
      emitBoardRefresh: jest.fn()
    } as any;

    const service = new PaymentsService(prisma, configService, realtimeGateway);

    const result = await service.initializePayment({
      paymentId: "payment-1",
      orderId: "order-1",
      orderNumber: "TK-TEST",
      amountMinor: 1299,
      currencyCode: "EUR",
      idempotencyKey: "checkout-key-123",
      customerEmail: "customer@example.com"
    });

    expect(result.clientSecret).toBeNull();
    expect(realtimeGateway.emitOrderUpdated).toHaveBeenCalled();
  });
```

- [ ] **Step 3: Run the payments spec**

Run:

```powershell
pnpm --filter @tuckinn/api test -- src/payments/payments.service.spec.ts --runInBand
```

Expected:
- PASS, or fail with a concrete service contract mismatch that should be fixed minimally.

---

### Task 5: Add Webhook Controller Coverage And Full API Verification

**Files:**
- Create: `platform/apps/api/src/webhooks/webhooks.controller.spec.ts`

- [ ] **Step 1: Add a controller pass-through test**

Create:

```ts
import { WebhooksController } from "./webhooks.controller";

describe("WebhooksController", () => {
  it("passes rawBody and stripe-signature to PaymentsService", async () => {
    const paymentsService = {
      processStripeWebhook: jest.fn().mockResolvedValue({ received: true })
    } as any;

    const controller = new WebhooksController(paymentsService);
    const rawBody = Buffer.from("payload");

    await expect(
      controller.handleStripeWebhook({ rawBody }, "sig_123")
    ).resolves.toEqual({ received: true });

    expect(paymentsService.processStripeWebhook).toHaveBeenCalledWith(rawBody, "sig_123");
  });
});
```

- [ ] **Step 2: Run the webhook spec**

Run:

```powershell
pnpm --filter @tuckinn/api test -- src/webhooks/webhooks.controller.spec.ts --runInBand
```

Expected:
- PASS

- [ ] **Step 3: Run the full API test suite**

Run:

```powershell
pnpm --filter @tuckinn/api test -- --runInBand
pnpm --filter @tuckinn/api build
```

Expected:
- all new specs pass
- API build remains green

---

## Self-Review

- Spec coverage: This plan covers the current Phase 2 target: validation hardening and checkout/payment regression tests in the checked-in PaymentIntent flow.
- Placeholder scan: No placeholders or deferred “TBD” steps remain.
- Type consistency: The tests target the current `initializePayment` flow and the current webhook controller contract, not the older dirty-workspace checkout-session variant.
