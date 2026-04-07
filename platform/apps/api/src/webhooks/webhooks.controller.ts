import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req
} from "@nestjs/common";
import { PaymentsService } from "../payments/payments.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("stripe")
  @HttpCode(200)
  handleStripeWebhook(
    @Req() request: { rawBody?: Buffer | string },
    @Headers("stripe-signature") signature?: string
  ) {
    return this.paymentsService.processStripeWebhook(
      request.rawBody ?? "",
      signature
    );
  }
}
