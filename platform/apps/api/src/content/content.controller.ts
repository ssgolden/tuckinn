import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { RoleCode } from "../../src/generated/prisma/index.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { ContentService } from "./content.service";
import { CreateContentBlockDto } from "./dto/create-content-block.dto";
import { UpdateContentBlockDto } from "./dto/update-content-block.dto";

@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get("public")
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getPublicBlocks(@Query("locationCode") locationCode?: string) {
    return this.contentService.findPublished(locationCode || "main");
  }

  @Get("blocks")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
  listBlocks(@Query("locationCode") locationCode?: string) {
    return this.contentService.listBlocks(locationCode || "main");
  }

  @Get("blocks/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
  getBlock(@Param("id") id: string) {
    return this.contentService.getBlock(id);
  }

  @Post("blocks")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  createBlock(
    @Query("locationCode") locationCode: string,
    @Body() dto: CreateContentBlockDto
  ) {
    return this.contentService.createBlock(locationCode || "main", dto);
  }

  @Patch("blocks/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  updateBlock(@Param("id") id: string, @Body() dto: UpdateContentBlockDto) {
    return this.contentService.updateBlock(id, dto);
  }

  @Delete("blocks/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin)
  deleteBlock(@Param("id") id: string) {
    return this.contentService.deleteBlock(id);
  }
}