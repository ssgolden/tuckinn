import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { RoleCode } from "../../src/generated/prisma/index.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { NotificationsService } from "./notifications.service";
import { UpdateNotificationConfigDto } from "./dto/update-notification-config.dto";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("config")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.admin, RoleCode.owner, RoleCode.manager)
  getConfig() {
    return this.notificationsService.getConfig();
  }

  @Patch("config")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.admin, RoleCode.owner, RoleCode.manager)
  updateConfig(@Body() dto: UpdateNotificationConfigDto) {
    return this.notificationsService.updateConfig(dto);
  }
}