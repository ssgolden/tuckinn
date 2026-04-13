import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { OrderStatus, OrderType } from "../../src/generated/prisma/index.js";
import { toDisplayAmount } from "../common/money.utils";
import { PrismaService } from "../prisma/prisma.service";

type OrderScope = "active" | "history" | "all";

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.paid,
  OrderStatus.accepted,
  OrderStatus.preparing,
  OrderStatus.ready
];

const HISTORY_STATUSES: OrderStatus[] = [
  OrderStatus.completed,
  OrderStatus.cancelled,
  OrderStatus.refunded
];

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicOrder(orderNumber: string, email?: string, phone?: string) {
    if (!email && !phone) {
      throw new BadRequestException("Customer email or phone is required.");
    }

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: this.orderInclude
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();
    const emailMatches =
      normalizedEmail &&
      order.customerEmail &&
      order.customerEmail.toLowerCase() === normalizedEmail;
    const phoneMatches =
      normalizedPhone && order.customerPhone && order.customerPhone === normalizedPhone;

    if (!emailMatches && !phoneMatches) {
      throw new NotFoundException("Order not found.");
    }

    return this.formatOrder(order);
  }

  async listOrders(params: {
    locationCode?: string;
    status?: OrderStatus;
    scope?: OrderScope;
    orderKind?: OrderType;
  }) {
    const statuses = params.status
      ? [params.status]
      : this.getStatusesForScope(params.scope ?? "all");

    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: statuses
        },
        ...(params.locationCode
          ? {
              location: {
                code: params.locationCode
              }
            }
          : {}),
        ...(params.orderKind
          ? {
              orderKind: params.orderKind
            }
          : {})
      },
      include: this.orderInclude,
      orderBy: [{ createdAt: "desc" }]
    });

    return orders.map(order => this.formatOrder(order));
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: this.orderInclude
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return this.formatOrder(order);
  }

  private readonly orderInclude = {
    location: true,
    diningTable: true,
    items: {
      include: {
        modifiers: true
      },
      orderBy: [{ createdAt: "asc" as const }]
    },
    payments: {
      orderBy: [{ createdAt: "desc" as const }]
    }
  };

  private getStatusesForScope(scope: OrderScope) {
    switch (scope) {
      case "active":
        return ACTIVE_STATUSES;
      case "history":
        return HISTORY_STATUSES;
      case "all":
      default:
        return Object.values(OrderStatus);
    }
  }

  private formatOrder(order: any) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderKind: order.orderKind,
      currencyCode: order.currencyCode,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      specialInstructions: order.specialInstructions,
      deliveryAddress: this.getDeliveryAddress(order.metadata),
      subtotalAmount: toDisplayAmount(order.subtotalAmount),
      discountAmount: toDisplayAmount(order.discountAmount),
      taxAmount: toDisplayAmount(order.taxAmount),
      totalAmount: toDisplayAmount(order.totalAmount),
      createdAt: order.createdAt,
      acceptedAt: order.acceptedAt,
      preparingAt: order.preparingAt,
      readyAt: order.readyAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      location: order.location
        ? {
            id: order.location.id,
            code: order.location.code,
            name: order.location.name
          }
        : null,
      diningTable: order.diningTable
        ? {
            id: order.diningTable.id,
            tableNumber: order.diningTable.tableNumber,
            qrSlug: order.diningTable.qrSlug
          }
        : null,
      items: order.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        itemName: item.itemName,
        notes: item.notes,
        unitPriceAmount: toDisplayAmount(item.unitPriceAmount),
        lineTotalAmount: toDisplayAmount(item.lineTotalAmount),
        modifiers: item.modifiers.map((modifier: any) => ({
          id: modifier.id,
          modifierGroupName: modifier.modifierGroupName,
          modifierOptionName: modifier.modifierOptionName,
          priceDeltaAmount: toDisplayAmount(modifier.priceDeltaAmount)
        })),
        snapshot: item.snapshot
      })),
      payments: order.payments.map((payment: any) => ({
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
      }))
    };
  }

  private getDeliveryAddress(metadata: unknown) {
    if (!metadata || typeof metadata !== "object") {
      return null;
    }

    const deliveryAddress = (metadata as { deliveryAddress?: unknown }).deliveryAddress;
    if (!deliveryAddress || typeof deliveryAddress !== "object") {
      return null;
    }

    const address = deliveryAddress as {
      line1?: unknown;
      line2?: unknown;
      city?: unknown;
      postcode?: unknown;
    };

    if (
      typeof address.line1 !== "string" ||
      typeof address.city !== "string" ||
      typeof address.postcode !== "string"
    ) {
      return null;
    }

    return {
      line1: address.line1,
      line2: typeof address.line2 === "string" ? address.line2 : null,
      city: address.city,
      postcode: address.postcode
    };
  }
}
