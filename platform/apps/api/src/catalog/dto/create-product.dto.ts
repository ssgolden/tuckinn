import {
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

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  locationCode!: string;

  @IsOptional()
  @ValidateIf((o) => !o.categoryId)
  @IsString()
  @MinLength(2)
  categorySlug?: string;

  @IsOptional()
  @ValidateIf((o) => !o.categorySlug)
  @IsUUID()
  categoryId?: string;

  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(2)
  name!: string;

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
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsString()
  @MinLength(2)
  variantName!: string;

  @IsNumber()
  @Min(0)
  priceAmount!: number;
}
