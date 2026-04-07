import {
  Body,
  Controller,
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
import { CatalogService } from "./catalog.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("public")
  getPublicCatalog(@Query("locationCode") locationCode?: string) {
    return this.catalogService.getPublicCatalog(locationCode);
  }

  @Get("categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
  listCategories(@Query("locationCode") locationCode?: string) {
    return this.catalogService.listCategories(locationCode);
  }

  @Get("products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager, RoleCode.staff)
  listProducts(
    @Query("locationCode") locationCode?: string,
    @Query("categorySlug") categorySlug?: string
  ) {
    return this.catalogService.listProducts(locationCode, categorySlug);
  }

  @Post("categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch("categories/:categoryId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  updateCategory(@Param("categoryId") categoryId: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(categoryId, dto);
  }

  @Post("products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Patch("products/:productId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.owner, RoleCode.admin, RoleCode.manager)
  updateProduct(@Param("productId") productId: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.updateProduct(productId, dto);
  }
}
