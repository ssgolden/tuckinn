import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards
} from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OrderStatus, RoleCode } from "../../src/generated/prisma/index.js";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { FulfillmentService } from "./fulfillment.service";

@Controller("fulfillment")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Get("board")
  getBoard(
    @Query("locationCode") locationCode?: string,
    @Query("scope") scope?: "active" | "history" | "all",
    @Query("status") status?: OrderStatus
  ) {
    return this.fulfillmentService.getBoard({
      locationCode,
      scope,
      status
    });
  }

  @Patch("orders/:orderId/status")
  updateOrderStatus(
    @Param("orderId") orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    return this.fulfillmentService.updateOrderStatus({
      orderId,
      status: dto.status,
      note: dto.note,
      actorUserId: user?.sub
    });
  }
}
