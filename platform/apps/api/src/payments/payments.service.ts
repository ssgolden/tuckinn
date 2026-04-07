import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import {
  PaymentProvider,
  PaymentStatus,
  OrderStatus,
  CartStatus
} from "../../src/generated/prisma/index.js";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
const stripeFactory: (key: string, config?: Record<string, unknown>) => any =
  require("stripe");

@Injectable()
export class PaymentsService {
  private readonly stripe: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly realtimeGateway: RealtimeGateway
  ) {
    const stripeSecretKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    this.stripe =
      stripeSecretKey && stripeSecretKey !== "replace-me"
        ? stripeFactory(stripeSecretKey)
        : null;
  }

  ensureProviderConfigured(provider: PaymentProvider) {
    if (provider !== PaymentProvider.stripe) {
      throw new ServiceUnavailableException("Only Stripe is configured in this phase.");
    }

    if (!this.stripe && !this.isMockPaymentsEnabled()) {
      throw new ServiceUnavailableException("Stripe is not configured.");
    }
  }

  async processStripeWebhook(rawBody: Buffer | string, signature?: string) {
    if (!signature) {
      throw new BadRequestException("Missing Stripe signature header.");
    }

    if (!this.stripe) {
      throw new ServiceUnavailableException("Stripe is not configured.");
    }

    const webhookSecret = this.configService.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret || webhookSecret === "replace-me") {
      throw new ServiceUnavailableException("Stripe webhook secret is not configured.");
    }

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature.";
      throw new BadRequestException(message);
    }

    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId: event.id }
    });

    if (existing?.processedAt) {
      return {
        received: true,
        duplicate: true
      };
    }

    await this.prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      update: {
        eventType: event.type,
        payload: event,
        processingError: null
      },
      create: {
        provider: PaymentProvider.stripe,
        eventId: event.id,
        eventType: event.type,
        payload: event
      }
    });

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
        case "payment_intent.payment_failed":
        case "payment_intent.canceled":
        case "payment_intent.processing":
        case "payment_intent.requires_action":
        case "payment_intent.amount_capturable_updated":
          await this.syncStripePaymentIntent(event.data.object, event.id, event.type);
          break;
        default:
          break;
      }

      await this.prisma.webhookEvent.update({
        where: { eventId: event.id },
        data: {
          processedAt: new Date(),
          processingError: null
        }
      });

      return {
        received: true,
        eventId: event.id,
        eventType: event.type
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe webhook processing failed.";

      await this.prisma.webhookEvent.update({
        where: { eventId: event.id },
        data: {
          processingError: message
        }
      });

      throw error;
    }
  }

  async getCheckoutStateByIdempotencyKey(idempotencyKey: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: {
        order: {
          include: {
            items: {
              include: {
                modifiers: true
              },
              orderBy: [{ createdAt: "asc" }]
            }
          }
        }
      }
    });

    return payment ? this.formatCheckoutState(payment) : null;
  }

  async createPendingPaymentRecord(input: {
    orderId: string;
    provider: PaymentProvider;
    idempotencyKey: string;
    currencyCode: string;
  }, prisma: PrismaService | any = this.prisma) {
    return prisma.payment.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        status: PaymentStatus.pending,
        idempotencyKey: input.idempotencyKey,
        currencyCode: input.currencyCode
      }
    });
  }

  async initializePayment(input: {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    amountMinor: number;
    currencyCode: string;
    idempotencyKey: string;
    customerEmail?: string;
  }) {
    if (!this.stripe) {
      if (this.isMockPaymentsEnabled()) {
        return this.initializeMockPayment(input);
      }

      throw new ServiceUnavailableException("Stripe is not configured.");
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: input.paymentId }
    });

    if (!payment) {
      throw new NotFoundException("Payment record not found.");
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: input.amountMinor,
          currency: input.currencyCode.toLowerCase(),
          automatic_payment_methods: {
            enabled: true
          },
          receipt_email: input.customerEmail,
          metadata: {
            orderId: input.orderId,
            orderNumber: input.orderNumber,
            paymentId: input.paymentId
          }
        },
        {
          idempotencyKey: input.idempotencyKey
        }
      );

      const updatedPayment = await this.prisma.payment.update({
        where: { id: input.paymentId },
        data: {
          providerIntentId: paymentIntent.id,
          providerPaymentId: paymentIntent.latest_charge
            ? String(paymentIntent.latest_charge)
            : null,
          status: this.mapStripeStatus(paymentIntent.status),
          amountAuthorized: this.fromMinorUnits(paymentIntent.amount),
          amountCaptured:
            paymentIntent.status === "succeeded"
              ? this.fromMinorUnits(paymentIntent.amount_received)
              : null,
          metadata: paymentIntent
        }
      });

      await this.prisma.paymentEvent.create({
        data: {
          paymentId: updatedPayment.id,
          provider: PaymentProvider.stripe,
          eventType: `payment_intent.${paymentIntent.status}`,
          providerEventId: paymentIntent.id,
          payload: paymentIntent,
          processedAt: new Date()
        }
      });

      return {
        payment: updatedPayment,
        clientSecret: paymentIntent.client_secret,
        publishableKey:
          this.configService.get<string>("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") ||
          null
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Stripe payment intent creation failed.";

      const failedPayment = await this.prisma.payment.update({
        where: { id: input.paymentId },
        data: {
          status: PaymentStatus.failed,
          failureMessage: message
        }
      });

      await this.prisma.paymentEvent.create({
        data: {
          paymentId: failedPayment.id,
          provider: PaymentProvider.stripe,
          eventType: "payment_intent.failed_to_create",
          payload: {
            message
          },
          processedAt: new Date()
        }
      });

      throw new ServiceUnavailableException(message);
    }
  }

  private async initializeMockPayment(input: {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    amountMinor: number;
    currencyCode: string;
    idempotencyKey: string;
    customerEmail?: string;
  }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: input.paymentId },
      include: {
        order: true
      }
    });

    if (!payment) {
      throw new NotFoundException("Payment record not found.");
    }

    const mockIntentId = `mock_pi_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const amountDisplay = this.fromMinorUnits(input.amountMinor);
    const paymentMetadata = {
      mode: "mock",
      provider: "stripe",
      mockIntentId,
      amountMinor: input.amountMinor,
      currencyCode: input.currencyCode,
      customerEmail: input.customerEmail ?? null
    };
    const cartId =
      payment.order.metadata &&
      typeof payment.order.metadata === "object" &&
      !Array.isArray(payment.order.metadata)
        ? String((payment.order.metadata as Record<string, unknown>).cartId ?? "")
        : "";

    const updatedPayment = await this.prisma.$transaction(async tx => {
      const nextPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          providerIntentId: mockIntentId,
          providerPaymentId: mockIntentId,
          status: PaymentStatus.paid,
          amountAuthorized: amountDisplay,
          amountCaptured: amountDisplay,
          failureCode: null,
          failureMessage: null,
          metadata: paymentMetadata
        }
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: nextPayment.id,
          provider: PaymentProvider.stripe,
          eventType: "payment.mock_succeeded",
          providerEventId: mockIntentId,
          payload: paymentMetadata,
          processedAt: new Date()
        }
      });

      await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: OrderStatus.paid,
          cancelledAt: null
        }
      });

      if (cartId) {
        await tx.cart.update({
          where: { id: cartId },
          data: {
            status: CartStatus.converted
          }
        });
      }

      return nextPayment;
    });

    this.realtimeGateway.emitOrderUpdated({
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      status: OrderStatus.paid,
      source: "payments"
    });
    this.realtimeGateway.emitBoardRefresh({
      source: "payments",
      orderId: input.orderId,
      status: OrderStatus.paid
    });

    return {
      payment: updatedPayment,
      clientSecret: null,
      publishableKey: null
    };
  }

  private isMockPaymentsEnabled() {
    const configured = this.configService.get<string>("ALLOW_MOCK_PAYMENTS");
    if (configured) {
      return configured === "true";
    }

    return this.configService.get<string>("NODE_ENV") !== "production";
  }

  private async syncStripePaymentIntent(
    paymentIntent: any,
    providerEventId: string,
    eventType: string
  ) {
    const payment =
      (paymentIntent.metadata?.paymentId
        ? await this.prisma.payment.findUnique({
            where: { id: String(paymentIntent.metadata.paymentId) },
            include: {
              order: true
            }
          })
        : null) ??
      (paymentIntent.id
        ? await this.prisma.payment.findFirst({
            where: { providerIntentId: String(paymentIntent.id) },
            include: {
              order: true
            }
          })
        : null);

    if (!payment) {
      throw new NotFoundException("Payment record for Stripe event was not found.");
    }

    const paymentStatus = this.mapStripeStatus(paymentIntent.status);
    const orderStatus = this.mapOrderStatusFromPayment(paymentStatus);
    const cartId =
      payment.order.metadata &&
      typeof payment.order.metadata === "object" &&
      !Array.isArray(payment.order.metadata)
        ? String((payment.order.metadata as Record<string, unknown>).cartId ?? "")
        : "";

    await this.prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          providerIntentId: paymentIntent.id ? String(paymentIntent.id) : payment.providerIntentId,
          providerPaymentId: paymentIntent.latest_charge
            ? String(paymentIntent.latest_charge)
            : payment.providerPaymentId,
          status: paymentStatus,
          amountAuthorized:
            typeof paymentIntent.amount === "number"
              ? this.fromMinorUnits(paymentIntent.amount)
              : payment.amountAuthorized,
          amountCaptured:
            typeof paymentIntent.amount_received === "number"
              ? this.fromMinorUnits(paymentIntent.amount_received)
              : payment.amountCaptured,
          failureCode: paymentIntent.last_payment_error?.code ?? null,
          failureMessage: paymentIntent.last_payment_error?.message ?? null,
          metadata: paymentIntent
        }
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          provider: PaymentProvider.stripe,
          eventType,
          providerEventId,
          payload: paymentIntent,
          processedAt: new Date()
        }
      });

      if (orderStatus) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            status: orderStatus,
            cancelledAt: orderStatus === OrderStatus.cancelled ? new Date() : null
          }
        });
      }

      if (cartId) {
        await tx.cart.updateMany({
          where: { id: cartId },
          data: {
            status:
              paymentStatus === PaymentStatus.paid ? CartStatus.converted : CartStatus.active
          }
        });
      }
    });

    const refreshedOrder = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true
      }
    });

    if (refreshedOrder) {
      this.realtimeGateway.emitOrderUpdated({
        orderId: refreshedOrder.id,
        orderNumber: refreshedOrder.orderNumber,
        status: refreshedOrder.status,
        source: "payments"
      });
      this.realtimeGateway.emitBoardRefresh({
        source: "payments",
        orderId: refreshedOrder.id,
        status: refreshedOrder.status
      });
    }
  }

  private formatCheckoutState(payment: {
    id: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    currencyCode: string;
    failureMessage: string | null;
    providerIntentId: string | null;
    amountAuthorized: unknown;
    amountCaptured: unknown;
    order: {
      id: string;
      orderNumber: string;
      status: string;
      totalAmount: unknown;
      customerName: string;
      customerEmail: string | null;
      customerPhone: string | null;
      orderKind: string;
      items: Array<{
        id: string;
        quantity: number;
        itemName: string;
        unitPriceAmount: unknown;
        lineTotalAmount: unknown;
        notes: string | null;
        modifiers: Array<{
          id: string;
          modifierGroupName: string;
          modifierOptionName: string;
          priceDeltaAmount: unknown;
        }>;
      }>;
    };
  }) {
    return {
      order: {
        id: payment.order.id,
        orderNumber: payment.order.orderNumber,
        status: payment.order.status,
        orderKind: payment.order.orderKind,
        customerName: payment.order.customerName,
        customerEmail: payment.order.customerEmail,
        customerPhone: payment.order.customerPhone,
        totalAmount: this.toDisplayAmount(payment.order.totalAmount),
        items: payment.order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          itemName: item.itemName,
          notes: item.notes,
          unitPriceAmount: this.toDisplayAmount(item.unitPriceAmount),
          lineTotalAmount: this.toDisplayAmount(item.lineTotalAmount),
          modifiers: item.modifiers.map(modifier => ({
            id: modifier.id,
            modifierGroupName: modifier.modifierGroupName,
            modifierOptionName: modifier.modifierOptionName,
            priceDeltaAmount: this.toDisplayAmount(modifier.priceDeltaAmount)
          }))
        }))
      },
      payment: {
        id: payment.id,
        provider: payment.provider,
        status: payment.status,
        currencyCode: payment.currencyCode,
        providerIntentId: payment.providerIntentId,
        amountAuthorized: payment.amountAuthorized
          ? this.toDisplayAmount(payment.amountAuthorized)
          : null,
        amountCaptured: payment.amountCaptured
          ? this.toDisplayAmount(payment.amountCaptured)
          : null,
        failureMessage: payment.failureMessage
      }
    };
  }

  private mapStripeStatus(status: string): PaymentStatus {
    switch (status) {
      case "requires_action":
        return PaymentStatus.requires_action;
      case "requires_capture":
        return PaymentStatus.authorized;
      case "succeeded":
        return PaymentStatus.paid;
      case "canceled":
        return PaymentStatus.cancelled;
      case "processing":
      case "requires_confirmation":
      case "requires_payment_method":
      default:
        return PaymentStatus.pending;
    }
  }

  private mapOrderStatusFromPayment(paymentStatus: PaymentStatus): OrderStatus | null {
    switch (paymentStatus) {
      case PaymentStatus.paid:
        return OrderStatus.paid;
      case PaymentStatus.cancelled:
        return OrderStatus.cancelled;
      default:
        return null;
    }
  }

  private fromMinorUnits(value: number): string {
    return (value / 100).toFixed(2);
  }

  private toDisplayAmount(value: unknown): number {
    return Number(Number(value ?? 0).toFixed(2));
  }
}
