import { OrderStatus, PaymentStatus } from "../../src/generated/prisma/index.js";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
  it("returns duplicate for a SumUp webhook event that was already processed", async () => {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue({
          eventId: "checkout_duplicate",
          processedAt: new Date()
        }),
        upsert: jest.fn(),
        update: jest.fn()
      }
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "SUMUP_WEBHOOK_SECRET") return "whsec_test";
        if (key === "SUMUP_API_KEY") return "test_key";
        if (key === "SUMUP_MERCHANT_CODE") return "MTEST";
        return null;
      })
    };
    const realtimeGateway = {
      emitOrderUpdated: jest.fn(),
      emitBoardRefresh: jest.fn()
    };

    const service = new PaymentsService(
      prisma as never,
      configService as never,
      realtimeGateway as never
    );

    const body = JSON.stringify({
      event_type: "CHECKOUT_STATUS_CHANGED",
      id: "checkout_duplicate"
    });

    await expect(
      service.processSumUpWebhook(Buffer.from(body))
    ).resolves.toEqual({
      received: true,
      duplicate: true
    });

    expect(prisma.webhookEvent.upsert).not.toHaveBeenCalled();
  });

  it("marks payment as failed when SumUp sends FAILED checkout status", async () => {
    const mockCheckout = {
      id: "checkout_123",
      checkout_reference: "ref_123",
      amount: 25.99,
      currency: "EUR",
      merchant_code: "MTEST",
      status: "FAILED"
    };

    const tx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      paymentEvent: { create: jest.fn().mockResolvedValue({}) },
      order: { update: jest.fn().mockResolvedValue({}) },
      cart: { updateMany: jest.fn().mockResolvedValue({}) }
    };

    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({})
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue({
          id: "payment-1",
          orderId: "order-1",
          order: {
            id: "order-1",
            orderNumber: "TK-260409-ABC12345",
            status: OrderStatus.pending_payment,
            metadata: { cartId: "cart-1" }
          }
        })
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          orderNumber: "TK-260409-ABC12345",
          status: OrderStatus.pending_payment
        })
      },
      $transaction: jest.fn().mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback(tx))
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === "SUMUP_WEBHOOK_SECRET") return null;
        if (key === "SUMUP_API_KEY") return "test_key";
        if (key === "SUMUP_MERCHANT_CODE") return "MTEST";
        return null;
      })
    };

    const realtimeGateway = {
      emitOrderUpdated: jest.fn(),
      emitBoardRefresh: jest.fn()
    };

    const service = new PaymentsService(
      prisma as never,
      configService as never,
      realtimeGateway as never
    );

    (service as unknown as { sumUp: unknown }).sumUp = {
      getCheckout: jest.fn().mockResolvedValue(mockCheckout)
    };

    const body = JSON.stringify({ event_type: "CHECKOUT_STATUS_CHANGED", id: "checkout_123" });
    await service.processSumUpWebhook(Buffer.from(body));

    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "payment-1" },
        data: expect.objectContaining({ status: PaymentStatus.failed })
      })
    );
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it("emits realtime payloads when SumUp sends SUCCESS checkout status", async () => {
    const mockCheckout = {
      id: "checkout_456",
      checkout_reference: "ref_456",
      amount: 25.99,
      currency: "EUR",
      merchant_code: "MTEST",
      status: "SUCCESS"
    };

    const tx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      paymentEvent: { create: jest.fn().mockResolvedValue({}) },
      order: { update: jest.fn().mockResolvedValue({ id: "order-2", orderNumber: "TK-260409-READY0001", status: OrderStatus.paid }) },
      cart: { updateMany: jest.fn().mockResolvedValue({}) }
    };

    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({})
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue({
          id: "payment-2",
          orderId: "order-2",
          order: {
            id: "order-2",
            orderNumber: "TK-260409-READY0001",
            status: OrderStatus.pending_payment,
            metadata: { cartId: "cart-2" }
          }
        })
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-2",
          orderNumber: "TK-260409-READY0001",
          status: OrderStatus.paid
        })
      },
      $transaction: jest.fn().mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback(tx))
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === "SUMUP_API_KEY") return "test_key";
        if (key === "SUMUP_MERCHANT_CODE") return "MTEST";
        return null;
      })
    };

    const realtimeGateway = {
      emitOrderUpdated: jest.fn(),
      emitBoardRefresh: jest.fn()
    };

    const service = new PaymentsService(
      prisma as never,
      configService as never,
      realtimeGateway as never
    );

    (service as unknown as { sumUp: unknown }).sumUp = {
      getCheckout: jest.fn().mockResolvedValue(mockCheckout)
    };

    const body = JSON.stringify({ event_type: "CHECKOUT_STATUS_CHANGED", id: "checkout_456" });
    await service.processSumUpWebhook(Buffer.from(body));

    expect(realtimeGateway.emitOrderUpdated).toHaveBeenCalledWith({
      orderId: "order-2",
      orderNumber: "TK-260409-READY0001",
      status: OrderStatus.paid,
      source: "payments"
    });
    expect(realtimeGateway.emitBoardRefresh).toHaveBeenCalledWith({
      source: "payments",
      orderId: "order-2",
      status: OrderStatus.paid
    });
    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PaymentStatus.paid,
          providerPaymentId: "checkout_456"
        })
      })
    );
  });
});
