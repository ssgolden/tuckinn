import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { RoleCode } from "../../src/generated/prisma/index.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { PaymentsService } from "./payments.service";

@Controller("payments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("order/:orderId")
  getPaymentsForOrder(@Param("orderId") orderId: string) {
    return this.paymentsService.getPaymentsForOrder(orderId);
  }

  @Get("idempotency/:idempotencyKey")
  getCheckoutState(@Param("idempotencyKey") idempotencyKey: string) {
    return this.paymentsService.getCheckoutStateByIdempotencyKey(idempotencyKey);
  }
}
