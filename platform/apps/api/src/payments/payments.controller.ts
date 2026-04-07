import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PaymentsService } from "./payments.service";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("idempotency/:idempotencyKey")
  getCheckoutState(@Param("idempotencyKey") idempotencyKey: string) {
    return this.paymentsService.getCheckoutStateByIdempotencyKey(idempotencyKey);
  }
}
