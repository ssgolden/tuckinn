type CheckoutResult = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    orderKind: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    deliveryAddress: Record<string, unknown> | null;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  };
  payment: {
    id: string;
    provider: string;
    status: string;
    currencyCode: string;
    checkoutUrl: string | null;
    clientSecret: string | null;
    publishableKey: string | null;
  };
};

import {
  BadRequestException,
  Injectable
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { CartStatus, OrderStatus, PaymentProvider } from "../../src/generated/prisma/index.js";
import { PaymentsService } from "../payments/payments.service";
import { PrismaService } from "../prisma/prisma.service";
import { StartCheckoutDto } from "./dto/start-checkout.dto";

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService
  ) {}

  async startCheckout(dto: StartCheckoutDto) {
    const existingCheckout = await this.paymentsService.getCheckoutStateByIdempotencyKey(
      dto.idempotencyKey
    );

    if (existingCheckout) {
      return existingCheckout;
    }

    const provider = dto.paymentProvider ?? PaymentProvider.stripe;
    this.paymentsService.ensureProviderConfigured(provider);

    const cart = await this.prisma.cart.findUnique({
      where: { id: dto.cartId },
      include: {
        location: true,
        diningTable: true,
        items: {
          orderBy: [{ createdAt: "asc" }],
          include: {
            modifiers: true
          }
        }
      }
    });

    if (!cart) {
      throw new BadRequestException("Cart not found.");
    }

    if (cart.status !== CartStatus.active) {
      throw new BadRequestException("Only active carts can be checked out.");
    }

    if (!cart.location) {
      throw new BadRequestException("Cart location is missing.");
    }

    const locationCode = cart.location.code;

    if (cart.items.length === 0) {
      throw new BadRequestException("Cart is empty.");
    }

    if (dto.orderKind === "instore" && !cart.diningTableId) {
      throw new BadRequestException("In-store orders require a dining table.");
    }

    if (dto.orderKind === "delivery" && !dto.deliveryAddress) {
      throw new BadRequestException("Delivery orders require a delivery address.");
    }

    const totalMinor = this.toMinorUnits(cart.totalAmount);
    if (totalMinor <= 0) {
      throw new BadRequestException("Cart total must be greater than zero.");
    }

    const deliveryAddress =
      dto.orderKind === "delivery" ? this.normalizeDeliveryAddress(dto.deliveryAddress) : null;

    const checkoutRecord = await this.prisma.$transaction(async tx => {
      const order = await tx.order.create({
        data: {
          orderNumber: this.createOrderNumber(),
          customerUserId: cart.customerUserId ?? undefined,
          locationId: cart.locationId ?? undefined,
          diningTableId: cart.diningTableId ?? undefined,
          status: OrderStatus.pending_payment,
          orderKind: dto.orderKind,
          currencyCode: cart.currencyCode,
          subtotalAmount: cart.subtotalAmount,
          discountAmount: cart.discountAmount,
          taxAmount: cart.taxAmount,
          totalAmount: cart.totalAmount,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          specialInstructions: dto.specialInstructions,
          metadata: {
            cartId: cart.id,
            locationCode,
            ...(deliveryAddress ? { deliveryAddress } : {})
          }
        }
      });

      for (const item of cart.items) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId ?? undefined,
            productVariantId: item.productVariantId ?? undefined,
            quantity: item.quantity,
            itemName: item.itemName,
            unitPriceAmount: item.unitPriceAmount,
            lineTotalAmount: item.lineTotalAmount,
            notes: item.notes,
            snapshot: item.snapshot ?? {}
          }
        });

        for (const modifier of item.modifiers) {
          await tx.orderItemModifier.create({
            data: {
              orderItemId: orderItem.id,
              modifierGroupName: modifier.modifierGroupName,
              modifierOptionName: modifier.modifierOptionName,
              priceDeltaAmount: modifier.priceDeltaAmount,
              snapshot: modifier.snapshot ?? {}
            }
          });
        }
      }

      const payment = await this.paymentsService.createPendingPaymentRecord({
        orderId: order.id,
        provider,
        idempotencyKey: dto.idempotencyKey,
        currencyCode: cart.currencyCode
      }, tx);

      return {
        order,
        payment
      };
    });

    const checkoutSession = await this.paymentsService.createCheckoutSession({
      paymentId: checkoutRecord.payment.id,
      orderId: checkoutRecord.order.id,
      orderNumber: checkoutRecord.order.orderNumber,
      amountMinor: totalMinor,
      currencyCode: cart.currencyCode,
      idempotencyKey: dto.idempotencyKey,
      customerEmail: dto.customerEmail,
      customerName: dto.customerName,
      lineItems: cart.items.map(item => ({
        name: item.itemName,
        amount: this.toMinorUnits(item.unitPriceAmount),
        quantity: item.quantity
      })),
      storefrontUrl: this.paymentsService.getStorefrontUrl()
    });

    const finalizedCheckout = await this.paymentsService.getCheckoutStateByIdempotencyKey(
      dto.idempotencyKey
    );

    const checkoutUrl = 'checkoutUrl' in checkoutSession ? (checkoutSession as Record<string, unknown>).checkoutUrl as string | null : null;

    if (finalizedCheckout) {
      const base = finalizedCheckout as Record<string, any>;
      return {
        ...base,
        payment: {
          ...(base.payment as Record<string, unknown>),
          checkoutUrl,
          clientSecret: null,
          publishableKey: null
        }
      } as CheckoutResult;
    }

    return {
      order: {
        id: checkoutRecord.order.id,
        orderNumber: checkoutRecord.order.orderNumber,
        status: checkoutRecord.order.status,
        orderKind: checkoutRecord.order.orderKind,
        customerName: checkoutRecord.order.customerName,
        customerEmail: checkoutRecord.order.customerEmail,
        customerPhone: checkoutRecord.order.customerPhone,
        deliveryAddress,
        subtotalAmount: this.toDisplayAmount(checkoutRecord.order.subtotalAmount),
        discountAmount: this.toDisplayAmount(checkoutRecord.order.discountAmount),
        taxAmount: this.toDisplayAmount(checkoutRecord.order.taxAmount),
        totalAmount: this.toDisplayAmount(checkoutRecord.order.totalAmount)
      },
      payment: {
        id: checkoutRecord.payment.id,
        provider: checkoutRecord.payment.provider,
        status: checkoutRecord.payment.status,
        currencyCode: checkoutRecord.payment.currencyCode,
        checkoutUrl,
        clientSecret: null,
        publishableKey: null
      }
    } as CheckoutResult;
  }

  private createOrderNumber() {
    return `TK-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;
  }

  private toMinorUnits(value: unknown): number {
    return Math.round(Number(value ?? 0) * 100);
  }

  private toDisplayAmount(value: unknown): number {
    return Number(Number(value ?? 0).toFixed(2));
  }

  private normalizeDeliveryAddress(address: StartCheckoutDto["deliveryAddress"]) {
    if (!address) {
      return null;
    }

    return {
      line1: address.line1.trim(),
      line2: address.line2?.trim() || undefined,
      city: address.city.trim(),
      postcode: address.postcode.trim()
    };
  }
}
