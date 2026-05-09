import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomUUID } from "node:crypto";
import {
  PaymentProvider,
  PaymentStatus,
  OrderStatus,
  CartStatus
} from "../../src/generated/prisma/index.js";
import { fromMinorUnits, toDisplayAmount } from "../common/money.utils";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { SumUpClient } from "./sumup.client";

@Injectable()
export class PaymentsService {
  private readonly sumUp: SumUpClient | null;
  private readonly merchantCode: string | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly realtimeGateway: RealtimeGateway
  ) {
    const apiKey = this.configService.get<string>("SUMUP_API_KEY");
    this.merchantCode = this.configService.get<string>("SUMUP_MERCHANT_CODE") ?? null;
    this.sumUp =
      apiKey && apiKey !== "replace-me"
        ? new SumUpClient(apiKey)
        : null;
  }

  ensureProviderConfigured(provider: PaymentProvider) {
    if (provider !== PaymentProvider.sumup) {
      throw new ServiceUnavailableException("Only SumUp is configured.");
    }

    if (!this.sumUp && !this.isMockPaymentsEnabled()) {
      throw new ServiceUnavailableException("SumUp is not configured.");
    }
  }

  async processSumUpWebhook(rawBody: Buffer | string, signature?: string) {
    const webhookSecret = this.configService.get<string>("SUMUP_WEBHOOK_SECRET");

    if (webhookSecret && webhookSecret !== "replace-me" && signature) {
      const expected = createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");
      if (expected !== signature) {
        throw new BadRequestException("Invalid SumUp webhook signature.");
      }
    }

    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;
    let event: { event_type: string; id: string };
    try {
      event = JSON.parse(bodyStr) as { event_type: string; id: string };
    } catch {
      throw new BadRequestException("Invalid SumUp webhook payload.");
    }

    if (!event.id) {
      throw new BadRequestException("Missing checkout id in SumUp webhook.");
    }

    const checkoutId = event.id;

    const existing = await this.prisma.webhookEvent.findUnique({
      where: { eventId: checkoutId }
    });

    if (existing?.processedAt) {
      return { received: true, duplicate: true };
    }

    await this.prisma.webhookEvent.upsert({
      where: { eventId: checkoutId },
      update: {
        eventType: event.event_type,
        payload: JSON.parse(JSON.stringify(event)),
        processingError: null
      },
      create: {
        provider: PaymentProvider.sumup,
        eventId: checkoutId,
        eventType: event.event_type,
        payload: JSON.parse(JSON.stringify(event))
      }
    });

    try {
      if (event.event_type === "CHECKOUT_STATUS_CHANGED") {
        await this.handleSumUpCheckoutStatusChanged(checkoutId);
      }

      await this.prisma.webhookEvent.update({
        where: { eventId: checkoutId },
        data: { processedAt: new Date(), processingError: null }
      });

      return { received: true, checkoutId, eventType: event.event_type };
    } catch (error) {
      const message = error instanceof Error ? error.message : "SumUp webhook processing failed.";
      await this.prisma.webhookEvent.update({
        where: { eventId: checkoutId },
        data: { processingError: message }
      });
      throw error;
    }
  }

  private async handleSumUpCheckoutStatusChanged(checkoutId: string) {
    if (!this.sumUp) return;

    const checkout = await this.sumUp.getCheckout(checkoutId);

    const payment = await this.prisma.payment.findFirst({
      where: { providerIntentId: checkoutId },
      include: { order: true }
    });

    if (!payment) {
      throw new NotFoundException(`No payment found for SumUp checkout ${checkoutId}.`);
    }

    const paymentStatus = this.mapSumUpStatus(checkout.status);
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
          providerPaymentId: checkout.id,
          status: paymentStatus,
          amountCaptured:
            paymentStatus === PaymentStatus.paid
              ? fromMinorUnits(Math.round(checkout.amount * 100))
              : null,
          failureCode: paymentStatus === PaymentStatus.failed ? "sumup_failed" : null,
          failureMessage: paymentStatus === PaymentStatus.failed ? "Payment declined by SumUp." : null,
          metadata: JSON.parse(JSON.stringify(checkout))
        }
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          provider: PaymentProvider.sumup,
          eventType: "CHECKOUT_STATUS_CHANGED",
          providerEventId: checkoutId,
          payload: JSON.parse(JSON.stringify(checkout)),
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

      if (cartId && paymentStatus === PaymentStatus.paid) {
        await tx.cart.updateMany({
          where: { id: cartId },
          data: { status: CartStatus.converted }
        });
      }
    });

    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      select: { id: true, orderNumber: true, status: true }
    });

    if (order) {
      this.realtimeGateway.emitOrderUpdated({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        source: "payments"
      });
      this.realtimeGateway.emitBoardRefresh({
        source: "payments",
        orderId: order.id,
        status: order.status
      });
    }
  }

  async getPaymentsForOrder(orderId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: [{ createdAt: "desc" }]
    });

    return payments.map(payment => ({
      id: payment.id,
      provider: payment.provider,
      status: payment.status,
      currencyCode: payment.currencyCode,
      providerIntentId: payment.providerIntentId,
      amountAuthorized: payment.amountAuthorized
        ? toDisplayAmount(payment.amountAuthorized)
        : null,
      amountCaptured: payment.amountCaptured
        ? toDisplayAmount(payment.amountCaptured)
        : null,
      amountRefunded: toDisplayAmount(payment.amountRefunded),
      failureCode: payment.failureCode,
      failureMessage: payment.failureMessage,
      createdAt: payment.createdAt
    }));
  }

  async getCheckoutStateByIdempotencyKey(idempotencyKey: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
      include: {
        order: {
          include: {
            items: {
              include: { modifiers: true },
              orderBy: [{ createdAt: "asc" }]
            }
          }
        }
      }
    });

    return payment ? this.formatCheckoutState(payment) : null;
  }

  async createPendingPaymentRecord(
    input: {
      orderId: string;
      provider: PaymentProvider;
      idempotencyKey: string;
      currencyCode: string;
    },
    prisma: PrismaService | Parameters<Parameters<PrismaService["$transaction"]>[0]>[0] = this.prisma
  ) {
    return (prisma as PrismaService).payment.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        status: PaymentStatus.pending,
        idempotencyKey: input.idempotencyKey,
        currencyCode: input.currencyCode
      }
    });
  }

  async createCheckoutSession(input: {
    paymentId: string;
    orderId: string;
    orderNumber: string;
    amountMinor: number;
    currencyCode: string;
    idempotencyKey: string;
    customerEmail?: string;
    customerName?: string;
    lineItems?: Array<{ name: string; amount: number; quantity: number }>;
    storefrontUrl?: string;
  }) {
    if (!this.sumUp || !this.merchantCode) {
      if (this.isMockPaymentsEnabled()) {
        return this.createMockCheckout(input);
      }
      throw new ServiceUnavailableException("SumUp is not configured.");
    }

    const storefrontUrl = input.storefrontUrl || this.getStorefrontUrl();
    const decimalAmount = input.amountMinor / 100;

    try {
      const checkout = await this.sumUp.createCheckout({
        checkout_reference: input.idempotencyKey,
        amount: decimalAmount,
        currency: input.currencyCode,
        merchant_code: this.merchantCode,
        description: `Order ${input.orderNumber}`,
        redirect_url: `${storefrontUrl}/?payment=success&order=${input.orderNumber}`
      });

      await this.prisma.payment.update({
        where: { id: input.paymentId },
        data: {
          providerIntentId: checkout.id,
          status: PaymentStatus.pending,
          amountAuthorized: fromMinorUnits(input.amountMinor),
          metadata: { checkoutId: checkout.id, checkoutReference: checkout.checkout_reference }
        }
      });

      await this.prisma.paymentEvent.create({
        data: {
          paymentId: input.paymentId,
          provider: PaymentProvider.sumup,
          eventType: "checkout.created",
          providerEventId: checkout.id,
          payload: { checkoutId: checkout.id, reference: checkout.checkout_reference },
          processedAt: new Date()
        }
      });

      return { checkoutId: checkout.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : "SumUp checkout creation failed.";
      await this.prisma.payment.update({
        where: { id: input.paymentId },
        data: { status: PaymentStatus.failed, failureMessage: message }
      });
      throw new ServiceUnavailableException(message);
    }
  }

  private async createMockCheckout(input: {
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
      include: { order: true }
    });

    if (!payment) {
      throw new NotFoundException("Payment record not found.");
    }

    const mockCheckoutId = `mock_su_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const amountDisplay = fromMinorUnits(input.amountMinor);
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
          providerIntentId: mockCheckoutId,
          providerPaymentId: mockCheckoutId,
          status: PaymentStatus.paid,
          amountAuthorized: amountDisplay,
          amountCaptured: amountDisplay,
          failureCode: null,
          failureMessage: null,
          metadata: { mode: "mock", provider: "sumup", mockCheckoutId }
        }
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          provider: PaymentProvider.sumup,
          eventType: "checkout.mock_succeeded",
          providerEventId: mockCheckoutId,
          payload: { mode: "mock", mockCheckoutId },
          processedAt: new Date()
        }
      });

      await tx.order.update({
        where: { id: input.orderId },
        data: { status: OrderStatus.paid, cancelledAt: null }
      });

      if (cartId) {
        await tx.cart.update({
          where: { id: cartId },
          data: { status: CartStatus.converted }
        });
      }
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

    return { checkoutId: null };
  }

  getStorefrontUrl(): string {
    const domain = this.configService.get<string>("STORE_DOMAIN");
    if (domain) {
      return `https://${domain}`;
    }

    if (this.configService.get<string>("NODE_ENV") === "production") {
      throw new ServiceUnavailableException(
        "STORE_DOMAIN is not configured. Set it in your environment before deploying."
      );
    }

    return "http://localhost:3005";
  }

  private isMockPaymentsEnabled() {
    const configured = this.configService.get<string>("ALLOW_MOCK_PAYMENTS");
    if (configured) {
      return configured === "true";
    }
    return this.configService.get<string>("NODE_ENV") !== "production";
  }

  private mapSumUpStatus(status: string): PaymentStatus {
    switch (status) {
      case "SUCCESS":
        return PaymentStatus.paid;
      case "FAILED":
        return PaymentStatus.failed;
      case "PENDING":
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
        totalAmount: toDisplayAmount(payment.order.totalAmount),
        items: payment.order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          itemName: item.itemName,
          notes: item.notes,
          unitPriceAmount: toDisplayAmount(item.unitPriceAmount),
          lineTotalAmount: toDisplayAmount(item.lineTotalAmount),
          modifiers: item.modifiers.map(modifier => ({
            id: modifier.id,
            modifierGroupName: modifier.modifierGroupName,
            modifierOptionName: modifier.modifierOptionName,
            priceDeltaAmount: toDisplayAmount(modifier.priceDeltaAmount)
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
          ? toDisplayAmount(payment.amountAuthorized)
          : null,
        amountCaptured: payment.amountCaptured
          ? toDisplayAmount(payment.amountCaptured)
          : null,
        failureMessage: payment.failureMessage
      }
    };
  }
}
