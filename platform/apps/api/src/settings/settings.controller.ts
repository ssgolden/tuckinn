import {
  Controller,
  Get,
  Patch,
  Query,
  Body,
  UseGuards
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { RoleCode } from "../../src/generated/prisma/index.js";
import { SettingsService } from "./settings.service";
import { UpdateBusinessSettingsDto } from "./dto/update-business-settings.dto";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("business")
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  getBusinessSettings(@Query("locationCode") locationCode: string = "main") {
    return this.settingsService.getBusinessSettings(locationCode);
  }

  @Patch("business")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  updateBusinessSettings(
    @Query("locationCode") locationCode: string = "main",
    @Body() dto: UpdateBusinessSettingsDto
  ) {
    return this.settingsService.updateBusinessSettings(locationCode, dto);
  }
}