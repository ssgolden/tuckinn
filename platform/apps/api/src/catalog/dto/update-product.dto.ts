import {
  IsEnum,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf
} from "class-validator";
import { ProductStatus } from "../../../src/generated/prisma/index.js";

export class UpdateProductDto {
  @IsOptional()
  @ValidateIf((o) => !o.categoryId)
  @IsString()
  @MinLength(2)
  categorySlug?: string;

  @IsOptional()
  @ValidateIf((o) => !o.categorySlug && o.categoryId !== null)
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageAltText?: string;

  @IsOptional()
  @IsBoolean()
  clearImage?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  variantName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number;
}
