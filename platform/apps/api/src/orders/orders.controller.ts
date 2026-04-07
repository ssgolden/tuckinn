import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards
} from "@nestjs/common";
import { OrderStatus, OrderType, RoleCode } from "../../src/generated/prisma/index.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("public/:orderNumber")
  getPublicOrder(
    @Param("orderNumber") orderNumber: string,
    @Query("email") email?: string,
    @Query("phone") phone?: string
  ) {
    return this.ordersService.getPublicOrder(orderNumber, email, phone);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
  listOrders(
    @Query("locationCode") locationCode?: string,
    @Query("status") status?: OrderStatus,
    @Query("scope") scope?: "active" | "history" | "all",
    @Query("orderKind") orderKind?: OrderType
  ) {
    return this.ordersService.listOrders({ locationCode, status, scope, orderKind });
  }

  @Get(":orderId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
  getOrderById(@Param("orderId") orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }
}
