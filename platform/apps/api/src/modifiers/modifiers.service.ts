import {
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AttachModifierGroupDto } from "./dto/attach-modifier-group.dto";
import { CreateModifierGroupDto } from "./dto/create-modifier-group.dto";
import { CreateModifierOptionDto } from "./dto/create-modifier-option.dto";

@Injectable()
export class ModifiersService {
  constructor(private readonly prisma: PrismaService) {}

  async listModifierGroups(locationCode?: string) {
    return this.prisma.modifierGroup.findMany({
      where: locationCode
        ? {
            location: {
              code: locationCode
            }
          }
        : undefined,
      include: {
        options: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true
              }
            }
          },
          orderBy: [{ sortOrder: "asc" }]
        }
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
  }

  async createModifierGroup(dto: CreateModifierGroupDto) {
    const location = await this.prisma.location.findUnique({
      where: { code: dto.locationCode }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    const existingGroup = await this.prisma.modifierGroup.findFirst({
      where: {
        locationId: location.id,
        name: dto.name
      }
    });

    if (existingGroup) {
      return this.prisma.modifierGroup.update({
        where: { id: existingGroup.id },
        data: {
          description: dto.description,
          minSelect: dto.minSelect ?? 0,
          maxSelect: dto.maxSelect ?? 1,
          sortOrder: dto.sortOrder ?? 0,
          isRequired: dto.isRequired ?? false
        },
        include: {
          options: {
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
          }
        }
      });
    }

    return this.prisma.modifierGroup.create({
      data: {
        locationId: location.id,
        name: dto.name,
        description: dto.description,
        minSelect: dto.minSelect ?? 0,
        maxSelect: dto.maxSelect ?? 1,
        sortOrder: dto.sortOrder ?? 0,
        isRequired: dto.isRequired ?? false
      },
      include: {
        options: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
        }
      }
    });
  }

  async createModifierOption(dto: CreateModifierOptionDto) {
    const modifierGroup = await this.prisma.modifierGroup.findUnique({
      where: { id: dto.modifierGroupId }
    });

    if (!modifierGroup) {
      throw new NotFoundException("Modifier group not found.");
    }

    const existingOption = await this.prisma.modifierOption.findFirst({
      where: {
        modifierGroupId: dto.modifierGroupId,
        name: dto.name
      }
    });

    if (existingOption) {
      return this.prisma.modifierOption.update({
        where: { id: existingOption.id },
        data: {
          description: dto.description,
          priceDeltaAmount: dto.priceDeltaAmount ?? 0,
          sortOrder: dto.sortOrder ?? 0,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true
        }
      });
    }

    return this.prisma.modifierOption.create({
      data: {
        modifierGroupId: dto.modifierGroupId,
        name: dto.name,
        description: dto.description,
        priceDeltaAmount: dto.priceDeltaAmount ?? 0,
        sortOrder: dto.sortOrder ?? 0,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true
      }
    });
  }

  async attachGroupToProduct(dto: AttachModifierGroupDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug: dto.productSlug,
        location: {
          code: dto.locationCode
        }
      }
    });

    if (!product) {
      throw new NotFoundException("Product not found.");
    }

    const modifierGroup = await this.prisma.modifierGroup.findUnique({
      where: { id: dto.modifierGroupId },
      include: {
        location: true
      }
    });

    if (!modifierGroup) {
      throw new NotFoundException("Modifier group not found.");
    }

    if (modifierGroup.location?.id && modifierGroup.location.id !== product.locationId) {
      throw new NotFoundException("Modifier group does not belong to the same location.");
    }

    await this.prisma.productModifierGroup.upsert({
      where: {
        productId_modifierGroupId: {
          productId: product.id,
          modifierGroupId: modifierGroup.id
        }
      },
      update: {
        sortOrder: dto.sortOrder ?? 0
      },
      create: {
        productId: product.id,
        modifierGroupId: modifierGroup.id,
        sortOrder: dto.sortOrder ?? 0
      }
    });

    return this.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: {
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                options: {
                  where: { isActive: true },
                  orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
                }
              }
            }
          },
          orderBy: [{ sortOrder: "asc" }]
        }
      }
    });
  }
}
