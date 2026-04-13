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
import { RoleCode } from "../../src/generated/prisma/index.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../rbac/roles.decorator";
import { RolesGuard } from "../rbac/roles.guard";
import { TablesService } from "./tables.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";

@Controller("tables")
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get("public/:qrSlug")
  getPublicTable(@Param("qrSlug") qrSlug: string) {
    return this.tablesService.getPublicTable(qrSlug);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
  listTables(@Query("locationCode") locationCode?: string) {
    return this.tablesService.listTables(locationCode || "main");
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
  getTable(@Param("id") id: string) {
    return this.tablesService.getTable(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  createTable(
    @Query("locationCode") locationCode: string,
    @Body() dto: CreateTableDto
  ) {
    return this.tablesService.createTable(locationCode || "main", dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  updateTable(@Param("id") id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.updateTable(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin)
  deleteTable(@Param("id") id: string) {
    return this.tablesService.deleteTable(id);
  }
}