import { Module } from "@nestjs/common";
import { HealthController } from "./common/health.controller";
import { AppConfigModule } from "./config/app-config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RbacModule } from "./rbac/rbac.module";
import { CustomersModule } from "./customers/customers.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ModifiersModule } from "./modifiers/modifiers.module";
import { PricingModule } from "./pricing/pricing.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { TablesModule } from "./tables/tables.module";
import { CartsModule } from "./carts/carts.module";
import { CheckoutModule } from "./checkout/checkout.module";
import { PaymentsModule } from "./payments/payments.module";
import { OrdersModule } from "./orders/orders.module";
import { FulfillmentModule } from "./fulfillment/fulfillment.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ContentModule } from "./content/content.module";
import { MediaModule } from "./media/media.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuditModule } from "./audit/audit.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { RealtimeModule } from "./realtime/realtime.module";

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    RbacModule,
    CustomersModule,
    CatalogModule,
    ModifiersModule,
    PricingModule,
    PromotionsModule,
    TablesModule,
    CartsModule,
    CheckoutModule,
    PaymentsModule,
    OrdersModule,
    FulfillmentModule,
    NotificationsModule,
    ContentModule,
    MediaModule,
    AnalyticsModule,
    AuditModule,
    WebhooksModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
