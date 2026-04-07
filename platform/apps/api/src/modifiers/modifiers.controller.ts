import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { UpdateModifierGroupDto } from "./dto/update-modifier-group.dto";
import { UpdateModifierOptionDto } from "./dto/update-modifier-option.dto";

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

  @Patch("groups/:modifierGroupId")
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  updateModifierGroup(
    @Param("modifierGroupId") modifierGroupId: string,
    @Body() dto: UpdateModifierGroupDto
  ) {
    return this.modifiersService.updateModifierGroup(modifierGroupId, dto);
  }

  @Post("options")
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  createModifierOption(@Body() dto: CreateModifierOptionDto) {
    return this.modifiersService.createModifierOption(dto);
  }

  @Patch("options/:modifierOptionId")
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  updateModifierOption(
    @Param("modifierOptionId") modifierOptionId: string,
    @Body() dto: UpdateModifierOptionDto
  ) {
    return this.modifiersService.updateModifierOption(modifierOptionId, dto);
  }

  @Post("attach")
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  attachGroupToProduct(@Body() dto: AttachModifierGroupDto) {
    return this.modifiersService.attachGroupToProduct(dto);
  }

  @Delete("products/:productId/groups/:modifierGroupId")
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  detachGroupFromProduct(
    @Param("productId") productId: string,
    @Param("modifierGroupId") modifierGroupId: string
  ) {
    return this.modifiersService.detachGroupFromProduct(productId, modifierGroupId);
  }
}
