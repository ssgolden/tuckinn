import { IsOptional, IsString, IsInt, IsBoolean, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

type DaySchedule = {
  open: string;
  close: string;
  closed: boolean;
};

export class UpdateBusinessSettingsDto {
  @IsOptional()
  openingHours?: Record<string, DaySchedule>;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minimumDeliveryOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1440)
  orderingCutoffMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isOnlineOrderingEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(500)
  deliveryRadiusKm?: number | null;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;
}