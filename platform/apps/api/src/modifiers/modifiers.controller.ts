import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { RoleCode } from "../../src/generated/prisma/index.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { AttachModifierGroupDto } from "./dto/attach-modifier-group.dto";
import { CreateModifierGroupDto } from "./dto/create-modifier-group.dto";
import { CreateModifierOptionDto } from "./dto/create-modifier-option.dto";
import { ModifiersService } from "./modifiers.service";

@Controller("modifiers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  @Get("groups")
  listModifierGroups(@Query("locationCode") locationCode?: string) {
    return this.modifiersService.listModifierGroups(locationCode);
  }

  @Post("groups")
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  createModifierGroup(@Body() dto: CreateModifierGroupDto) {
    return this.modifiersService.createModifierGroup(dto);
  }

  @Post("options")
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  createModifierOption(@Body() dto: CreateModifierOptionDto) {
    return this.modifiersService.createModifierOption(dto);
  }

  @Post("attach")
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  attachGroupToProduct(@Body() dto: AttachModifierGroupDto) {
    return this.modifiersService.attachGroupToProduct(dto);
  }
}
