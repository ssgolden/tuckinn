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

    const totalMinor = this.toMinorUnits(cart.totalAmount);
    if (totalMinor <= 0) {
      throw new BadRequestException("Cart total must be greater than zero.");
    }

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
            locationCode
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

    const initializedPayment = await this.paymentsService.initializePayment({
      paymentId: checkoutRecord.payment.id,
      orderId: checkoutRecord.order.id,
      orderNumber: checkoutRecord.order.orderNumber,
      amountMinor: totalMinor,
      currencyCode: cart.currencyCode,
      idempotencyKey: dto.idempotencyKey,
      customerEmail: dto.customerEmail
    });

    const finalizedCheckout = await this.paymentsService.getCheckoutStateByIdempotencyKey(
      dto.idempotencyKey
    );

    if (finalizedCheckout) {
      return {
        ...finalizedCheckout,
        payment: {
          ...finalizedCheckout.payment,
          clientSecret: initializedPayment.clientSecret,
          publishableKey: initializedPayment.publishableKey
        }
      };
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
        subtotalAmount: this.toDisplayAmount(checkoutRecord.order.subtotalAmount),
        discountAmount: this.toDisplayAmount(checkoutRecord.order.discountAmount),
        taxAmount: this.toDisplayAmount(checkoutRecord.order.taxAmount),
        totalAmount: this.toDisplayAmount(checkoutRecord.order.totalAmount)
      },
      payment: {
        id: initializedPayment.payment.id,
        provider: initializedPayment.payment.provider,
        status: initializedPayment.payment.status,
        currencyCode: initializedPayment.payment.currencyCode,
        clientSecret: initializedPayment.clientSecret,
        publishableKey: initializedPayment.publishableKey
      }
    };
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
}
