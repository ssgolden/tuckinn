import {
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ProductStatus } from "../../src/generated/prisma/index.js";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateProductDto } from "./dto/create-product.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicCatalog(locationCode = "main") {
    const location = await this.prisma.location.findUnique({
      where: { code: locationCode },
      include: {
        categories: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
        products: {
          where: { status: ProductStatus.active },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            variants: {
              where: { isActive: true },
              orderBy: [{ isDefault: "desc" }, { priceAmount: "asc" }]
            },
            modifierGroups: {
              orderBy: [{ sortOrder: "asc" }],
              include: {
                modifierGroup: {
                  include: {
                    options: {
                      where: { isActive: true },
                      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
                    }
                  }
                }
              }
            }
          }
        }
      }
        }
      }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    return {
      location: {
        code: location.code,
        name: location.name
      },
      categories: location.categories.map(category => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        products: category.products.map(product => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          isFeatured: product.isFeatured,
          variants: product.variants.map(variant => ({
            id: variant.id,
            name: variant.name,
            priceAmount: Number(variant.priceAmount),
            isDefault: variant.isDefault
          })),
          modifierGroups: product.modifierGroups.map(entry => ({
            id: entry.modifierGroup.id,
            name: entry.modifierGroup.name,
            description: entry.modifierGroup.description,
            minSelect: entry.modifierGroup.minSelect,
            maxSelect: entry.modifierGroup.maxSelect,
            isRequired: entry.modifierGroup.isRequired,
            options: entry.modifierGroup.options.map(option => ({
              id: option.id,
              name: option.name,
              description: option.description,
              priceDeltaAmount: Number(option.priceDeltaAmount),
              isDefault: option.isDefault
            }))
          }))
        }))
      }))
    };
  }

  async listCategories(locationCode?: string) {
    return this.prisma.category.findMany({
      where: locationCode
        ? {
            location: {
              code: locationCode
            }
          }
        : undefined,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
  }

  async listProducts(locationCode?: string, categorySlug?: string) {
    return this.prisma.product.findMany({
      where: {
        ...(locationCode
          ? {
              location: {
                code: locationCode
              }
            }
          : {}),
        ...(categorySlug
          ? {
              category: {
                slug: categorySlug
              }
            }
          : {})
      },
      include: {
        category: true,
        variants: {
          orderBy: [{ isDefault: "desc" }, { priceAmount: "asc" }]
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                options: {
                  orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
                }
              }
            }
          },
          orderBy: [{ sortOrder: "asc" }]
        }
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const location = await this.prisma.location.findUnique({
      where: { code: dto.locationCode }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    return this.prisma.category.upsert({
      where: {
        locationId_slug: {
          locationId: location.id,
          slug: dto.slug
        }
      },
      update: {
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isVisible: dto.isVisible ?? true
      },
      create: {
        locationId: location.id,
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isVisible: dto.isVisible ?? true
      }
    });
  }

  async createProduct(dto: CreateProductDto) {
    const productContext = await this.prisma.category.findFirst({
      where: {
        slug: dto.categorySlug,
        location: {
          code: dto.locationCode
        }
      },
      include: {
        location: true
      }
    });

    if (!productContext?.location) {
      throw new NotFoundException("Category or location not found.");
    }

    const product = await this.prisma.product.upsert({
      where: {
        locationId_slug: {
          locationId: productContext.location.id,
          slug: dto.slug
        }
      },
      update: {
        categoryId: productContext.id,
        name: dto.name,
        shortDescription: dto.shortDescription,
        longDescription: dto.longDescription,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        status: ProductStatus.active
      },
      create: {
        locationId: productContext.location.id,
        categoryId: productContext.id,
        slug: dto.slug,
        name: dto.name,
        shortDescription: dto.shortDescription,
        longDescription: dto.longDescription,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        status: ProductStatus.active
      }
    });

    const defaultVariant = await this.prisma.productVariant.findFirst({
      where: {
        productId: product.id,
        isDefault: true
      }
    });

    if (defaultVariant) {
      await this.prisma.productVariant.update({
        where: { id: defaultVariant.id },
        data: {
          name: dto.variantName,
          sku: dto.sku,
          priceAmount: dto.priceAmount,
          isActive: true
        }
      });
    } else {
      await this.prisma.productVariant.create({
        data: {
          productId: product.id,
          name: dto.variantName,
          sku: dto.sku,
          priceAmount: dto.priceAmount,
          isDefault: true,
          isActive: true
        }
      });
    }

    return this.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: {
        category: true,
        variants: {
          orderBy: [{ isDefault: "desc" }, { priceAmount: "asc" }]
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                options: {
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
