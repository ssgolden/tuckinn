import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalOrders, totalProducts, totalCategories, totalModifierGroups, totalTables, recentOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.product.count({ where: { status: "active" } }),
      this.prisma.category.count({ where: { isVisible: true } }),
      this.prisma.modifierGroup.count(),
      this.prisma.diningTable.count({ where: { isActive: true } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          currencyCode: true,
          customerName: true,
          createdAt: true
        }
      })
    ]);

    const totalRevenue = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["paid", "accepted", "preparing", "ready", "completed"] } }
    });

    return {
      totalOrders,
      totalProducts,
      totalCategories,
      totalModifierGroups,
      totalTables,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      recentOrders
    };
  }
}