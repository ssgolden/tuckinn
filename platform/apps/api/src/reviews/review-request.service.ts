import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ReviewRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  async sendReviewRequests() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

    const completedOrders = await this.prisma.order.findMany({
      where: {
        status: "completed",
        completedAt: {
          gte: twentyFiveHoursAgo,
          lte: twentyFourHoursAgo,
        },
        NOT: {
          metadata: {
            path: ["reviewRequested"],
            equals: true,
          },
        },
      },
    });

    for (const order of completedOrders) {
      const email = order.customerEmail;
      const firstName = order.customerName?.split(" ")[0] || "Customer";

      if (!email) continue;

      try {
        const reviewLink = `${this.configService.get("STOREFRONT_URL") || "https://tuckinn.local"}/review?order=${order.orderNumber}`;

        await this.emailService.sendReviewRequest(
          email,
          firstName,
          order.orderNumber,
          reviewLink
        );

        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            metadata: {
              ...(order.metadata as object),
              reviewRequested: true,
              reviewRequestedAt: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        console.error(`Failed to send review request for order ${order.id}`, error);
      }
    }
  }
}
