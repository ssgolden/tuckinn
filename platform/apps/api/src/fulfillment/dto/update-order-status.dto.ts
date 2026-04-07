import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { OrderStatus } from "../../../src/generated/prisma/index.js";

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
