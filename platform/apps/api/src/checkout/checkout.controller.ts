import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CheckoutService } from "./checkout.service";
import { StartCheckoutDto } from "./dto/start-checkout.dto";

@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("start")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  startCheckout(@Body() dto: StartCheckoutDto) {
    return this.checkoutService.startCheckout(dto);
  }
}
