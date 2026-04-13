import { IsOptional, IsString, IsInt, IsBoolean, Min, Max } from "class-validator";

export class CreateTableDto {
  @IsInt()
  @Min(1)
  @Max(999)
  tableNumber!: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  qrSlug!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  seats?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}