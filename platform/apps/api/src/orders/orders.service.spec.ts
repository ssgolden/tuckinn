import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OrderStatus, OrderType } from "../../src/generated/prisma/index.js";
import { OrdersService } from "./orders.service";

const sampleOrder = {
  id: "order-1",
  orderNumber: "TK-260409-ABC12345",
  status: OrderStatus.paid,
  orderKind: OrderType.collect,
  currencyCode: "EUR",
  customerName: "Test Customer",
  customerEmail: "customer@example.com",
  customerPhone: "0870000000",
  specialInstructions: null,
  metadata: null,
  subtotalAmount: 10,
  discountAmount: 0,
  taxAmount: 1,
  totalAmount: 11,
  createdAt: new Date("2026-01-01"),
  acceptedAt: null,
  preparingAt: null,
  readyAt: null,
  completedAt: null,
  cancelledAt: null,
  location: { id: "loc-1", code: "main", name: "Main" },
  diningTable: null,
  items: [
    {
      id: "item-1",
      quantity: 1,
      itemName: "Latte",
      notes: null,
      unitPriceAmount: 10,
      lineTotalAmount: 10,
      modifiers: [],
      snapshot: {}
    }
  ],
  payments: [
    {
      id: "pay-1",
      provider: "stripe",
      status: "succeeded",
      currencyCode: "EUR",
      providerIntentId: "pi_123",
      amountAuthorized: 11,
      amountCaptured: 11,
      amountRefunded: 0,
      failureCode: null,
      failureMessage: null,
      createdAt: new Date("2026-01-01")
    }
  ]
};

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    ...overrides
  };
}

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new OrdersService(prisma as never);
  });

  describe("getPublicOrder", () => {
    it("throws BadRequestException if neither email nor phone provided", async () => {
      await expect(service.getPublicOrder("TK-12345")).rejects.toThrow(
        BadRequestException
      );
    });

    it("throws NotFoundException if order not found by orderNumber", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.getPublicOrder("TK-NONEXIST", "customer@example.com")
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException if email does not match order", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      await expect(
        service.getPublicOrder("TK-260409-ABC12345", "wrong@example.com")
      ).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException if phone does not match order", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      await expect(
        service.getPublicOrder("TK-260409-ABC12345", undefined, "0879999999")
      ).rejects.toThrow(NotFoundException);
    });

    it("returns order when email matches", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.getPublicOrder(
        "TK-260409-ABC12345",
        "customer@example.com"
      );

      expect(result.orderNumber).toBe("TK-260409-ABC12345");
      expect(result.customerEmail).toBe("customer@example.com");
    });

    it("returns order when phone matches", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.getPublicOrder(
        "TK-260409-ABC12345",
        undefined,
        "0870000000"
      );

      expect(result.orderNumber).toBe("TK-260409-ABC12345");
    });

    it("returns order when both email and phone match", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.getPublicOrder(
        "TK-260409-ABC12345",
        "customer@example.com",
        "0870000000"
      );

      expect(result.id).toBe("order-1");
    });

    it("is case-insensitive for email matching", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.getPublicOrder(
        "TK-260409-ABC12345",
        "CUSTOMER@EXAMPLE.COM"
      );

      expect(result.orderNumber).toBeDefined();
    });
  });

  describe("listOrders", () => {
    it("returns all orders by default (scope=all)", async () => {
      prisma.order.findMany.mockResolvedValue([sampleOrder]);

      const result = await service.listOrders({});

      expect(result.data).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
      expect(result.pageSize).toBe(50);
      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.status.in).toEqual(Object.values(OrderStatus));
    });

    it("paginates with cursor + nextCursor when more results exist", async () => {
      // Mock returns take+1 items so the service knows there's a next page
      const orders = Array.from({ length: 51 }, (_, i) => ({
        ...sampleOrder,
        id: `order-${i + 1}`,
        orderNumber: `TK-${i + 1}`
      }));
      prisma.order.findMany.mockResolvedValue(orders);

      const result = await service.listOrders({ limit: 50 });

      expect(result.data).toHaveLength(50);
      expect(result.nextCursor).toBe("order-50");
      const args = prisma.order.findMany.mock.calls[0][0];
      expect(args.take).toBe(51);
      expect(args.cursor).toBeUndefined();
    });

    it("clamps limit to MAX_ORDER_PAGE_SIZE", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      const result = await service.listOrders({ limit: 9999 });
      expect(result.pageSize).toBe(200);
    });

    it("uses cursor + skip when paging forward", async () => {
      prisma.order.findMany.mockResolvedValue([sampleOrder]);
      await service.listOrders({ cursor: "order-50", limit: 25 });
      const args = prisma.order.findMany.mock.calls[0][0];
      expect(args.cursor).toEqual({ id: "order-50" });
      expect(args.skip).toBe(1);
      expect(args.take).toBe(26);
    });

    it("filters by active scope", async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.listOrders({ scope: "active" });

      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.status.in).toEqual([
        OrderStatus.paid,
        OrderStatus.accepted,
        OrderStatus.preparing,
        OrderStatus.ready
      ]);
    });

    it("filters by history scope", async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.listOrders({ scope: "history" });

      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.status.in).toEqual([
        OrderStatus.completed,
        OrderStatus.cancelled,
        OrderStatus.refunded
      ]);
    });

    it("filters by specific status", async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.listOrders({ status: OrderStatus.preparing });

      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.status.in).toEqual([OrderStatus.preparing]);
    });

    it("filters by locationCode", async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.listOrders({ locationCode: "main" });

      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.location).toEqual({ code: "main" });
    });

    it("filters by orderKind", async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.listOrders({ orderKind: OrderType.delivery });

      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.orderKind).toBe(OrderType.delivery);
    });

    it("combines filters: locationCode + status + orderKind", async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.listOrders({
        locationCode: "branch",
        status: OrderStatus.ready,
        orderKind: OrderType.collect
      });

      const where = prisma.order.findMany.mock.calls[0][0].where;
      expect(where.location).toEqual({ code: "branch" });
      expect(where.status.in).toEqual([OrderStatus.ready]);
      expect(where.orderKind).toBe(OrderType.collect);
    });
  });

  describe("getOrderById", () => {
    it("throws NotFoundException if order not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById("bad-id")).rejects.toThrow(
        NotFoundException
      );
    });

    it("returns formatted order when found", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.getOrderById("order-1");

      expect(result.id).toBe("order-1");
      expect(result.orderNumber).toBe("TK-260409-ABC12345");
      expect(result.items).toHaveLength(1);
      expect(result.payments).toHaveLength(1);
    });
  });

  describe("formatOrder (private, tested via public methods)", () => {
    it("maps delivery address from metadata", async () => {
      const deliveryOrder = {
        ...sampleOrder,
        orderKind: OrderType.delivery,
        metadata: {
          deliveryAddress: {
            line1: "12 Market St",
            line2: "Apt 3",
            city: "Dublin",
            postcode: "D02 AB12"
          }
        }
      };
      prisma.order.findUnique.mockResolvedValue(deliveryOrder);

      const result = await service.getOrderById("order-1");

      expect(result.deliveryAddress).toEqual({
        line1: "12 Market St",
        line2: "Apt 3",
        city: "Dublin",
        postcode: "D02 AB12"
      });
    });

    it("returns null deliveryAddress when metadata has no delivery info", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.getOrderById("order-1");

      expect(result.deliveryAddress).toBeNull();
    });

    it("maps dining table info when present", async () => {
      const dineInOrder = {
        ...sampleOrder,
        diningTable: {
          id: "table-1",
          tableNumber: 5,
          qrSlug: "table-5"
        }
      };
      prisma.order.findUnique.mockResolvedValue(dineInOrder);

      const result = await service.getOrderById("order-1");

      expect(result.diningTable).toEqual({
        id: "table-1",
        tableNumber: 5,
        qrSlug: "table-5"
      });
    });

    it("formats money amounts as numbers", async () => {
      prisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.getOrderById("order-1");

      expect(result.subtotalAmount).toBe(10);
      expect(result.taxAmount).toBe(1);
      expect(result.totalAmount).toBe(11);
      expect(typeof result.subtotalAmount).toBe("number");
    });
  });
});