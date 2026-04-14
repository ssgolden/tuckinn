import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateBusinessSettingsDto } from "./dto/update-business-settings.dto";
import { toDisplayAmount } from "../common/money.utils";

type DaySchedule = {
  open: string;
  close: string;
  closed: boolean;
};

type LocationWithSettings = {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string | null;
  openingHours: Record<string, DaySchedule>;
  taxRate: number | { toNumber(): number };
  deliveryFee: number | { toNumber(): number };
  minimumDeliveryOrder: number | { toNumber(): number };
  orderingCutoffMinutes: number;
  isOnlineOrderingEnabled: boolean;
  deliveryRadiusKm: number | null;
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBusinessSettings(locationCode: string) {
    const location = await this.prisma.location.findUnique({
      where: { code: locationCode }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    // Cast to include new fields that will exist after migration
    const loc = location as unknown as LocationWithSettings;

    return {
      locationCode: loc.code,
      locationName: loc.name,
      currencyCode: loc.currencyCode,
      timezone: loc.timezone,
      phone: loc.phone,
      email: loc.email,
      addressLine1: loc.addressLine1,
      addressLine2: loc.addressLine2,
      city: loc.city,
      region: loc.region,
      postalCode: loc.postalCode,
      countryCode: loc.countryCode,
      openingHours: loc.openingHours ?? {},
      taxRate: typeof loc.taxRate === "object" ? loc.taxRate.toNumber() : Number(loc.taxRate || 0),
      deliveryFee: toDisplayAmount(typeof loc.deliveryFee === "object" ? loc.deliveryFee : Number(loc.deliveryFee || 0)),
      minimumDeliveryOrder: toDisplayAmount(typeof loc.minimumDeliveryOrder === "object" ? loc.minimumDeliveryOrder : Number(loc.minimumDeliveryOrder || 0)),
      orderingCutoffMinutes: loc.orderingCutoffMinutes ?? 0,
      isOnlineOrderingEnabled: loc.isOnlineOrderingEnabled ?? true,
      deliveryRadiusKm: loc.deliveryRadiusKm ?? null,
      isCurrentlyOpen: this.isCurrentlyOpen(loc.openingHours ?? {}, loc.timezone),
    };
  }

  async updateBusinessSettings(locationCode: string, dto: UpdateBusinessSettingsDto) {
    const location = await this.prisma.location.findUnique({
      where: { code: locationCode }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    const updateData: Record<string, unknown> = {};

    if (dto.openingHours !== undefined) updateData.openingHours = dto.openingHours;
    if (dto.taxRate !== undefined) updateData.taxRate = dto.taxRate;
    if (dto.deliveryFee !== undefined) updateData.deliveryFee = dto.deliveryFee;
    if (dto.minimumDeliveryOrder !== undefined) updateData.minimumDeliveryOrder = dto.minimumDeliveryOrder;
    if (dto.orderingCutoffMinutes !== undefined) updateData.orderingCutoffMinutes = dto.orderingCutoffMinutes;
    if (dto.isOnlineOrderingEnabled !== undefined) updateData.isOnlineOrderingEnabled = dto.isOnlineOrderingEnabled;
    if (dto.deliveryRadiusKm !== undefined) updateData.deliveryRadiusKm = dto.deliveryRadiusKm;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.addressLine1 !== undefined) updateData.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.region !== undefined) updateData.region = dto.region;
    if (dto.countryCode !== undefined) updateData.countryCode = dto.countryCode;

    await this.prisma.location.update({
      where: { code: locationCode },
      data: updateData
    });

    return this.getBusinessSettings(locationCode);
  }

  private isCurrentlyOpen(
    openingHours: Record<string, DaySchedule>,
    timezone: string
  ): boolean {
    const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    try {
      const now = new Date();
      const localStr = now.toLocaleString("en-US", { timeZone: timezone });
      const localDate = new Date(localStr);
      const dayKey = days[localDate.getDay()];
      const schedule = openingHours[dayKey];

      if (!schedule || schedule.closed) return false;

      const [openH, openM] = schedule.open.split(":").map(Number);
      const [closeH, closeM] = schedule.close.split(":").map(Number);
      const currentMinutes = localDate.getHours() * 60 + localDate.getMinutes();
      const openMinutes = (openH || 0) * 60 + (openM || 0);
      const closeMinutes = (closeH || 0) * 60 + (closeM || 0);

      if (closeMinutes > openMinutes) {
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      }
      // Overnight schedule (e.g. 22:00 - 02:00)
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    } catch {
      return true; // Default to open if timezone parsing fails
    }
  }
}