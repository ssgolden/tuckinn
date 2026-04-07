import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { Prisma } from "../../src/generated/prisma/index.js";
import { OrderStatus } from "../../src/generated/prisma/index.js";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

type BoardScope = "active" | "history" | "all";

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

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.pending_payment]: [OrderStatus.cancelled],
  [OrderStatus.paid]: [OrderStatus.accepted, OrderStatus.cancelled, OrderStatus.refunded],
  [OrderStatus.accepted]: [OrderStatus.preparing, OrderStatus.cancelled, OrderStatus.refunded],
  [OrderStatus.preparing]: [OrderStatus.ready, OrderStatus.cancelled, OrderStatus.refunded],
  [OrderStatus.ready]: [OrderStatus.completed, OrderStatus.refunded],
  [OrderStatus.completed]: [OrderStatus.refunded],
  [OrderStatus.cancelled]: [],
  [OrderStatus.refunded]: []
};

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  async getBoard(params: {
    locationCode?: string;
    scope?: BoardScope;
    status?: OrderStatus;
  }) {
    const scope = params.scope ?? "active";
    const statuses = params.status
      ? [params.status]
      : this.getStatusesForScope(scope);

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
          : {})
      },
      include: {
        location: true,
        diningTable: true,
        items: {
          include: {
            modifiers: true
          },
          orderBy: [{ createdAt: "asc" }]
        },
        payments: {
          orderBy: [{ createdAt: "desc" }]
        }
      },
      orderBy: [
        { status: "asc" },
        { createdAt: "asc" }
      ]
    });

    const formattedOrders = orders.map(order => this.formatOrder(order));

    return {
      scope,
      filters: {
        locationCode: params.locationCode ?? null,
        status: params.status ?? null
      },
      summary: {
        totalOrders: formattedOrders.length,
        byStatus: Object.values(OrderStatus).reduce<Record<string, number>>((acc, status) => {
          acc[status] = formattedOrders.filter(order => order.status === status).length;
          return acc;
        }, {}),
        totalRevenue: formattedOrders.reduce((sum, order) => {
          return order.status === OrderStatus.cancelled ? sum : sum + order.totalAmount;
        }, 0)
      },
      orders: formattedOrders
    };
  }

  async updateOrderStatus(input: {
    orderId: string;
    status: OrderStatus;
    note?: string;
    actorUserId?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId }
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    if (order.status === input.status) {
      return this.getOrderSnapshot(order.id);
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[order.status];
    if (!allowedNextStatuses.includes(input.status)) {
      throw new BadRequestException(
        `Invalid order status transition from "${order.status}" to "${input.status}".`
      );
    }

    const timestampPatch = this.getTimestampPatch(input.status);
    const nextMetadata = this.mergeMetadata(order.metadata, {
      lastStatusChangeAt: new Date().toISOString(),
      lastStatusChangeTo: input.status,
      lastStatusActorUserId: input.actorUserId ?? null,
      lastStatusNote: input.note ?? null
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        ...timestampPatch,
        metadata: nextMetadata
      }
    });

    const snapshot = await this.getOrderSnapshot(order.id);
    this.realtimeGateway.emitOrderUpdated({
      orderId: snapshot.id,
      orderNumber: snapshot.orderNumber,
      status: snapshot.status,
      source: "fulfillment"
    });
    this.realtimeGateway.emitBoardRefresh({
      source: "fulfillment",
      orderId: snapshot.id,
      status: snapshot.status
    });

    return snapshot;
  }

  private async getOrderSnapshot(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        location: true,
        diningTable: true,
        items: {
          include: {
            modifiers: true
          },
          orderBy: [{ createdAt: "asc" }]
        },
        payments: {
          orderBy: [{ createdAt: "desc" }]
        }
      }
    });

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    return this.formatOrder(order);
  }

  private getStatusesForScope(scope: BoardScope) {
    switch (scope) {
      case "history":
        return HISTORY_STATUSES;
      case "all":
        return Object.values(OrderStatus);
      case "active":
      default:
        return ACTIVE_STATUSES;
    }
  }

  private getTimestampPatch(status: OrderStatus) {
    const now = new Date();
    switch (status) {
      case OrderStatus.accepted:
        return {
          acceptedAt: now
        };
      case OrderStatus.preparing:
        return {
          preparingAt: now
        };
      case OrderStatus.ready:
        return {
          readyAt: now
        };
      case OrderStatus.completed:
        return {
          completedAt: now
        };
      case OrderStatus.cancelled:
        return {
          cancelledAt: now
        };
      default:
        return {};
    }
  }

  private mergeMetadata(
    currentValue: unknown,
    patch: Record<string, unknown>
  ): Prisma.InputJsonValue {
    if (!currentValue || typeof currentValue !== "object" || Array.isArray(currentValue)) {
      return patch as Prisma.InputJsonValue;
    }

    return {
      ...(currentValue as Record<string, unknown>),
      ...patch
    } as Prisma.InputJsonValue;
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
      subtotalAmount: this.toDisplayAmount(order.subtotalAmount),
      discountAmount: this.toDisplayAmount(order.discountAmount),
      taxAmount: this.toDisplayAmount(order.taxAmount),
      totalAmount: this.toDisplayAmount(order.totalAmount),
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
        unitPriceAmount: this.toDisplayAmount(item.unitPriceAmount),
        lineTotalAmount: this.toDisplayAmount(item.lineTotalAmount),
        modifiers: item.modifiers.map((modifier: any) => ({
          id: modifier.id,
          modifierGroupName: modifier.modifierGroupName,
          modifierOptionName: modifier.modifierOptionName,
          priceDeltaAmount: this.toDisplayAmount(modifier.priceDeltaAmount)
        }))
      })),
      payments: order.payments.map((payment: any) => ({
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
        amountRefunded: this.toDisplayAmount(payment.amountRefunded),
        failureCode: payment.failureCode,
        failureMessage: payment.failureMessage,
        createdAt: payment.createdAt
      })),
      metadata: order.metadata
    };
  }

  private toDisplayAmount(value: unknown): number {
    return Number(Number(value ?? 0).toFixed(2));
  }
}
