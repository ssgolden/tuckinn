import { OrderStatus, PaymentProvider, PaymentStatus } from "../../src/generated/prisma/index.js";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
  it("returns duplicate for a Stripe webhook event that was already processed", async () => {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue({
          eventId: "evt_duplicate",
          processedAt: new Date()
        }),
        upsert: jest.fn(),
        update: jest.fn()
      }
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "STRIPE_WEBHOOK_SECRET") {
          return "whsec_test";
        }

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

    (service as any).stripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          id: "evt_duplicate",
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_duplicate",
              status: "succeeded",
              metadata: {
                paymentId: "payment-1"
              }
            }
          }
        })
      }
    };

    await expect(
      service.processStripeWebhook(Buffer.from("{}"), "sig_test")
    ).resolves.toEqual({
      received: true,
      duplicate: true
    });

    expect(prisma.webhookEvent.upsert).not.toHaveBeenCalled();
  });

  it("marks payment intent failures as failed when Stripe sends payment_failed", async () => {
    const tx = {
      payment: {
        update: jest.fn().mockResolvedValue({})
      },
      paymentEvent: {
        create: jest.fn().mockResolvedValue({})
      },
      order: {
        update: jest.fn().mockResolvedValue({})
      },
      cart: {
        updateMany: jest.fn().mockResolvedValue({})
      }
    };

    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({})
      },
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "payment-1",
          orderId: "order-1",
          providerIntentId: null,
          providerPaymentId: null,
          amountAuthorized: null,
          amountCaptured: null,
          order: {
            id: "order-1",
            orderNumber: "TK-260409-ABC12345",
            status: OrderStatus.pending_payment,
            metadata: {
              cartId: "cart-1"
            }
          }
        }),
        findFirst: jest.fn()
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          orderNumber: "TK-260409-ABC12345",
          status: OrderStatus.pending_payment
        })
      },
      $transaction: jest.fn().mockImplementation(async callback => callback(tx))
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === "STRIPE_WEBHOOK_SECRET") {
          return "whsec_test";
        }

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

    const stripeEvent = {
      id: "evt_payment_failed",
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_123",
          status: "requires_payment_method",
          amount: 2599,
          amount_received: 0,
          latest_charge: "ch_123",
          metadata: {
            paymentId: "payment-1"
          },
          last_payment_error: {
            code: "card_declined",
            message: "Card was declined"
          }
        }
      }
    };

    (service as any).stripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(stripeEvent)
      }
    };

    await service.processStripeWebhook(Buffer.from("{}"), "sig_test");

    expect(tx.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "payment-1" },
        data: expect.objectContaining({
          status: PaymentStatus.failed,
          providerIntentId: "pi_123",
          providerPaymentId: "ch_123",
          failureCode: "card_declined",
          failureMessage: "Card was declined"
        })
      })
    );
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.cart.updateMany).toHaveBeenCalledWith({
      where: { id: "cart-1" },
      data: {
        status: "active"
      }
    });
    expect(tx.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentId: "payment-1",
          provider: PaymentProvider.stripe,
          eventType: "payment_intent.payment_failed",
          providerEventId: "evt_payment_failed"
        })
      })
    );
  });

  it("emits structured realtime payloads when checkout.session.completed marks an order as paid", async () => {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({})
      },
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "payment-2",
          orderId: "order-2",
          order: {
            id: "order-2",
            orderNumber: "TK-260409-READY0001",
            customerUserId: "customer-1"
          }
        }),
        update: jest.fn().mockResolvedValue({})
      },
      paymentEvent: {
        create: jest.fn().mockResolvedValue({})
      },
      order: {
        update: jest.fn().mockResolvedValue({
          id: "order-2",
          orderNumber: "TK-260409-READY0001",
          status: OrderStatus.paid,
          customerUserId: "customer-1"
        })
      },
      cart: {
        updateMany: jest.fn().mockResolvedValue({})
      }
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === "STRIPE_WEBHOOK_SECRET") {
          return "whsec_test";
        }

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

    const stripeEvent = {
      id: "evt_checkout_completed",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          payment_intent: "pi_123",
          amount_total: 2599,
          metadata: {
            paymentId: "payment-2"
          }
        }
      }
    };

    (service as any).stripe = {
      webhooks: {
        constructEvent: jest.fn().mockReturnValue(stripeEvent)
      }
    };

    await service.processStripeWebhook(Buffer.from("{}"), "sig_test");

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
  });
});
