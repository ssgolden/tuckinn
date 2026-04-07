import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class AttachModifierGroupDto {
  @IsString()
  @MinLength(2)
  locationCode!: string;

  @IsString()
  @MinLength(2)
  productSlug!: string;

  @IsString()
  @MinLength(2)
  modifierGroupId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
