import "reflect-metadata";
import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import { OrderType, PaymentProvider } from "../../../src/generated/prisma/index.js";

export class DeliveryAddressDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  line2?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  postcode!: string;
}

export class StartCheckoutDto {
  @IsUUID()
  cartId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey!: string;

  @IsEnum(OrderType)
  orderKind!: OrderType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customerName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  customerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string;

  @ValidateIf(dto => dto.orderKind === OrderType.delivery)
  @IsDefined()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @IsOptional()
  @IsEnum(PaymentProvider)
  paymentProvider?: PaymentProvider;
}
