import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentBlockStatus, type Prisma } from "../../src/generated/prisma/index.js";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContentBlockDto } from "./dto/create-content-block.dto";
import { UpdateContentBlockDto } from "./dto/update-content-block.dto";

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(locationCode = "main") {
    const location = await this.prisma.location.findUnique({
      where: { code: locationCode },
    });
    const where = {
      ...(location ? { locationId: location.id } : {}),
      status: ContentBlockStatus.published,
      startsAt: { lte: new Date() },
      OR: [
        { endsAt: null },
        { endsAt: { gte: new Date() } },
      ],
    };
    const blocks = await this.prisma.contentBlock.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        key: true,
        title: true,
        payload: true,
        startsAt: true,
        endsAt: true,
      },
    });
    return blocks;
  }

  async listBlocks(locationCode = "main") {
    const location = await this.prisma.location.findUnique({
      where: { code: locationCode },
    });
    // If no location found, return all blocks
    const where = location ? { locationId: location.id } : {};
    return this.prisma.contentBlock.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
  }

  async getBlock(id: string) {
    const block = await this.prisma.contentBlock.findUnique({ where: { id } });
    if (!block) throw new NotFoundException("Content block not found");
    return block;
  }

  async createBlock(locationCode: string, dto: CreateContentBlockDto) {
    const location = await this.prisma.location.findUnique({
      where: { code: locationCode },
    });

    return this.prisma.contentBlock.create({
      data: {
        locationId: location?.id || null,
        key: dto.key,
        title: dto.title,
        status: dto.status || "draft",
        payload: (dto.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async updateBlock(id: string, dto: UpdateContentBlockDto) {
    const block = await this.prisma.contentBlock.findUnique({ where: { id } });
    if (!block) throw new NotFoundException("Content block not found");

    return this.prisma.contentBlock.update({
      where: { id },
      data: {
        ...(dto.key !== undefined && { key: dto.key }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.payload !== undefined && { payload: dto.payload as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteBlock(id: string) {
    const block = await this.prisma.contentBlock.findUnique({ where: { id } });
    if (!block) throw new NotFoundException("Content block not found");
    await this.prisma.contentBlock.delete({ where: { id } });
    return { success: true };
  }
}