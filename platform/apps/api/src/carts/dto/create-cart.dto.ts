import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateCartDto {
  @IsString()
  @MinLength(2)
  locationCode!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  diningTableQrSlug?: string;
}
