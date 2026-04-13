import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTables(locationCode = "main") {
    const location = await this.prisma.location.findUnique({
      where: { code: locationCode },
    });
    if (!location) throw new NotFoundException("Location not found");

    return this.prisma.diningTable.findMany({
      where: { locationId: location.id },
      orderBy: { tableNumber: "asc" },
    });
  }

  async getTable(id: string) {
    const table = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException("Table not found");
    return table;
  }

  async getPublicTable(qrSlug: string) {
    const table = await this.prisma.diningTable.findUnique({
      where: { qrSlug },
    });
    if (!table || !table.isActive) throw new NotFoundException("Table not found");
    return { id: table.id, tableNumber: table.tableNumber, name: table.name, qrSlug: table.qrSlug, seats: table.seats };
  }

  async createTable(locationCode: string, dto: CreateTableDto) {
    const location = await this.prisma.location.findUnique({
      where: { code: locationCode },
    });
    if (!location) throw new NotFoundException("Location not found");

    // Check for unique table number in location
    const existing = await this.prisma.diningTable.findFirst({
      where: { locationId: location.id, tableNumber: dto.tableNumber },
    });
    if (existing) throw new ConflictException(`Table #${dto.tableNumber} already exists`);

    // Check for unique qrSlug
    const existingSlug = await this.prisma.diningTable.findUnique({
      where: { qrSlug: dto.qrSlug },
    });
    if (existingSlug) throw new ConflictException(`QR slug "${dto.qrSlug}" already in use`);

    return this.prisma.diningTable.create({
      data: {
        locationId: location.id,
        tableNumber: dto.tableNumber,
        name: dto.name || null,
        qrSlug: dto.qrSlug,
        seats: dto.seats ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateTable(id: string, dto: UpdateTableDto) {
    const table = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException("Table not found");

    return this.prisma.diningTable.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name || null }),
        ...(dto.tableNumber !== undefined && { tableNumber: dto.tableNumber }),
        ...(dto.seats !== undefined && { seats: dto.seats ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteTable(id: string) {
    const table = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException("Table not found");
    await this.prisma.diningTable.delete({ where: { id } });
    return { success: true };
  }
}