import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength
} from "class-validator";

export class CreateModifierGroupDto {
  @IsString()
  @MinLength(2)
  locationCode!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
