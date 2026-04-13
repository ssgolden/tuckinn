import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RoleCode } from "../../src/generated/prisma/index.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { PaymentsService } from "../payments/payments.service";
import { WebhooksService } from "./webhooks.service";
import { UpdateWebhookConfigDto } from "./dto/update-webhook-config.dto";

@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly webhooksService: WebhooksService
  ) {}

  @Post("stripe")
  @HttpCode(200)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  handleStripeWebhook(
    @Req() request: { rawBody?: Buffer | string },
    @Headers("stripe-signature") signature?: string
  ) {
    return this.paymentsService.processStripeWebhook(
      request.rawBody ?? "",
      signature
    );
  }

  @Get("config")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.admin, RoleCode.owner, RoleCode.manager)
  getConfig() {
    return this.webhooksService.getConfig();
  }

  @Patch("config")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.admin, RoleCode.owner, RoleCode.manager)
  updateConfig(@Body() dto: UpdateWebhookConfigDto) {
    return this.webhooksService.updateConfig(dto);
  }
}
