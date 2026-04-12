import { CartStatus, PaymentProvider } from "../../src/generated/prisma/index.js";
import { CheckoutService } from "./checkout.service";

describe("CheckoutService", () => {
  it("returns the existing checkout state for a reused idempotency key", async () => {
    const existingCheckout = {
      order: {
        id: "order-1",
        orderNumber: "TK-260409-ABC12345",
        status: "pending_payment"
      },
      payment: {
        id: "payment-1",
        status: "pending"
      }
    };

    const prisma = {
      cart: {
        findUnique: jest.fn()
      }
    };
    const paymentsService = {
      getCheckoutStateByIdempotencyKey: jest.fn().mockResolvedValue(existingCheckout),
      ensureProviderConfigured: jest.fn(),
      createPendingPaymentRecord: jest.fn(),
      initializePayment: jest.fn()
    };

    const service = new CheckoutService(prisma as never, paymentsService as never);

    await expect(
      service.startCheckout({
        cartId: "cart-1",
        idempotencyKey: "idem-1",
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        orderKind: "collect",
        paymentProvider: PaymentProvider.stripe
      })
    ).resolves.toBe(existingCheckout);

    expect(prisma.cart.findUnique).not.toHaveBeenCalled();
    expect(paymentsService.ensureProviderConfigured).not.toHaveBeenCalled();
    expect(paymentsService.createPendingPaymentRecord).not.toHaveBeenCalled();
    expect(paymentsService.initializePayment).not.toHaveBeenCalled();
  });

  it("rejects checkout when the cart is not active", async () => {
    const prisma = {
      cart: {
        findUnique: jest.fn().mockResolvedValue({
          id: "cart-1",
          status: CartStatus.converted,
          location: {
            code: "MAD"
          },
          diningTable: null,
          diningTableId: null,
          items: [
            {
              id: "item-1"
            }
          ]
        })
      }
    };
    const paymentsService = {
      getCheckoutStateByIdempotencyKey: jest.fn().mockResolvedValue(null),
      ensureProviderConfigured: jest.fn()
    };

    const service = new CheckoutService(prisma as never, paymentsService as never);

    await expect(
      service.startCheckout({
        cartId: "cart-1",
        idempotencyKey: "idem-2",
        customerName: "Test Customer",
        customerEmail: "customer@example.com",
        orderKind: "collect",
        paymentProvider: PaymentProvider.stripe
      })
    ).rejects.toThrow("Only active carts can be checked out.");

    expect(paymentsService.ensureProviderConfigured).toHaveBeenCalledWith(
      PaymentProvider.stripe
    );
  });

  it("stores delivery address details in order metadata", async () => {
    const orderCreate = jest.fn().mockResolvedValue({
      id: "order-1",
      orderNumber: "TK-260409-DEL12345",
      status: "pending_payment",
      orderKind: "delivery",
      customerName: "Test Customer",
      customerEmail: "customer@example.com",
      customerPhone: "0870000000",
      subtotalAmount: 10,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 10
    });
    const orderItemCreate = jest.fn().mockResolvedValue({ id: "order-item-1" });
    const orderItemModifierCreate = jest.fn();
    const paymentRecord = {
      id: "payment-1",
      provider: PaymentProvider.stripe,
      status: "pending",
      currencyCode: "EUR"
    };

    const prisma = {
      cart: {
        findUnique: jest.fn().mockResolvedValue({
          id: "cart-1",
          status: CartStatus.active,
          locationId: "location-1",
          customerUserId: null,
          diningTableId: null,
          location: {
            code: "main"
          },
          diningTable: null,
          currencyCode: "EUR",
          subtotalAmount: 10,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount: 10,
          items: [
            {
              id: "item-1",
              productId: "product-1",
              productVariantId: "variant-1",
              quantity: 1,
              itemName: "Option 1",
              unitPriceAmount: 10,
              lineTotalAmount: 10,
              notes: null,
              snapshot: {},
              modifiers: []
            }
          ]
        })
      },
      $transaction: jest.fn(async callback =>
        callback({
          order: {
            create: orderCreate
          },
          orderItem: {
            create: orderItemCreate
          },
          orderItemModifier: {
            create: orderItemModifierCreate
          }
        })
      )
    };
    const paymentsService = {
      getCheckoutStateByIdempotencyKey: jest.fn().mockResolvedValue(null),
      ensureProviderConfigured: jest.fn(),
      createPendingPaymentRecord: jest.fn().mockResolvedValue(paymentRecord),
      createCheckoutSession: jest.fn().mockResolvedValue({
        checkoutUrl: "https://checkout.example.test"
      }),
      getStorefrontUrl: jest.fn().mockReturnValue("https://storefront.example.test")
    };

    const service = new CheckoutService(prisma as never, paymentsService as never);

    await service.startCheckout({
      cartId: "cart-1",
      idempotencyKey: "idem-delivery-1",
      customerName: "Test Customer",
      customerEmail: "customer@example.com",
      customerPhone: "0870000000",
      orderKind: "delivery",
      paymentProvider: PaymentProvider.stripe,
      deliveryAddress: {
        line1: "12 Market Street",
        line2: "Flat 3",
        city: "Dublin",
        postcode: "D02 XY12"
      }
    });

    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            deliveryAddress: {
              line1: "12 Market Street",
              line2: "Flat 3",
              city: "Dublin",
              postcode: "D02 XY12"
            }
          })
        })
      })
    );
  });
});
