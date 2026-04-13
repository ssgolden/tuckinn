import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

export class AttachModifierGroupDto {
  @IsString()
  @MinLength(2)
  locationCode!: string;

  @IsString()
  @MinLength(2)
  productSlug!: string;

  @IsUUID()
  modifierGroupId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
