import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { HealthController, ReadinessController } from "./common/health.controller";
import { AppConfigModule } from "./config/app-config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { RbacModule } from "./rbac/rbac.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ModifiersModule } from "./modifiers/modifiers.module";
import { TablesModule } from "./tables/tables.module";
import { CartsModule } from "./carts/carts.module";
import { CheckoutModule } from "./checkout/checkout.module";
import { PaymentsModule } from "./payments/payments.module";
import { OrdersModule } from "./orders/orders.module";
import { FulfillmentModule } from "./fulfillment/fulfillment.module";
import { ContentModule } from "./content/content.module";
import { MediaModule } from "./media/media.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { RealtimeModule } from "./realtime/realtime.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ limit: 100, ttl: 60000 }]),
    AppConfigModule,
    PrismaModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    RbacModule,
    CatalogModule,
    ModifiersModule,
    TablesModule,
    CartsModule,
    CheckoutModule,
    PaymentsModule,
    OrdersModule,
    FulfillmentModule,
    ContentModule,
    MediaModule,
    WebhooksModule,
    NotificationsModule,
    AnalyticsModule
  ],
  controllers: [HealthController, ReadinessController]
})
export class AppModule {}
