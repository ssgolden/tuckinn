import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CartRecoveryService {
  private readonly logger = new Logger(CartRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  @Cron("*/15 * * * *")
  async checkAbandonedCarts() {
    this.logger.log("Checking for abandoned carts...");

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const abandonedCarts = await this.prisma.cart.findMany({
      where: {
        status: "active",
        updatedAt: {
          lt: oneHourAgo,
          gt: twentyFourHoursAgo,
        },
        customerUserId: { not: null },
        NOT: {
          metadata: {
            path: ["abandonedEmailSent"],
            equals: true,
          },
        },
      },
      include: {
        customer: {
          select: {
            email: true,
            firstName: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    for (const cart of abandonedCarts) {
      const email = cart.customer?.email;
      const firstName = cart.customer?.firstName || "Customer";

      if (!email) {
        this.logger.warn(`Cart ${cart.id} has no customer email, skipping`);
        continue;
      }

      try {
        const cartLink = `${this.configService.get("STOREFRONT_URL") || "https://187.124.217.8.sslip.io"}/?recoverCart=${cart.id}`;

        await this.emailService.sendAbandonedCartEmail(email, firstName, cartLink);

        await this.prisma.cart.update({
          where: { id: cart.id },
          data: {
            metadata: {
              ...(cart.metadata as object),
              abandonedEmailSent: true,
              abandonedEmailSentAt: new Date().toISOString(),
            },
          },
        });

        this.logger.log(`Abandoned cart email sent to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send abandoned cart email to ${email}`, error);
      }
    }

    this.logger.log(`Processed ${abandonedCarts.length} abandoned carts`);
  }
}
