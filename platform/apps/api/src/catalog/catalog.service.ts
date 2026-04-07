import {
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ProductStatus } from "../../src/generated/prisma/index.js";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

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
                imageAsset: true,
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
          longDescription: product.longDescription,
          imageUrl: product.imageAsset?.url ?? null,
          imageAltText: product.imageAsset?.altText ?? null,
          isFeatured: product.isFeatured,
          status: product.status,
          variants: product.variants.map(variant => ({
            id: variant.id,
            name: variant.name,
            priceAmount: Number(variant.priceAmount),
            isDefault: variant.isDefault,
            sku: variant.sku
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
    const products = await this.prisma.product.findMany({
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
        imageAsset: true,
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

    return products.map(product => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription,
      longDescription: product.longDescription,
      imageUrl: product.imageAsset?.url ?? null,
      imageAltText: product.imageAsset?.altText ?? null,
      isFeatured: product.isFeatured,
      sortOrder: product.sortOrder,
      status: product.status,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name
          }
        : null,
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        priceAmount: Number(variant.priceAmount),
        sku: variant.sku
      })),
      modifierGroups: product.modifierGroups.map(entry => ({
        modifierGroup: {
          id: entry.modifierGroup.id,
          name: entry.modifierGroup.name,
          options: entry.modifierGroup.options.map(option => ({
            id: option.id,
            name: option.name
          }))
        }
      }))
    }));
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

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundException("Category not found.");
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        slug: dto.slug ?? undefined,
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        sortOrder: dto.sortOrder ?? undefined,
        isVisible: dto.isVisible ?? undefined
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

    await this.syncProductImage(product.id, {
      imageUrl: dto.imageUrl,
      imageAltText: dto.imageAltText
    });

    return this.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: {
        category: true,
        imageAsset: true,
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

  async updateProduct(productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          orderBy: [{ isDefault: "desc" }, { priceAmount: "asc" }]
        }
      }
    });

    if (!product) {
      throw new NotFoundException("Product not found.");
    }

    let categoryId: string | undefined;
    if (dto.categorySlug) {
      const category = await this.prisma.category.findFirst({
        where: {
          slug: dto.categorySlug,
          locationId: product.locationId ?? undefined
        }
      });

      if (!category) {
        throw new NotFoundException("Category not found.");
      }

      categoryId = category.id;
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        categoryId,
        slug: dto.slug ?? undefined,
        name: dto.name ?? undefined,
        shortDescription: dto.shortDescription ?? undefined,
        longDescription: dto.longDescription ?? undefined,
        isFeatured: dto.isFeatured ?? undefined,
        sortOrder: dto.sortOrder ?? undefined,
        status: dto.status ?? undefined
      }
    });

    if (
      dto.variantName !== undefined ||
      dto.priceAmount !== undefined ||
      dto.sku !== undefined
    ) {
      const defaultVariant = product.variants.find(variant => variant.isDefault) ?? product.variants[0];

      if (!defaultVariant) {
        throw new NotFoundException("Product variant not found.");
      }

      await this.prisma.productVariant.update({
        where: { id: defaultVariant.id },
        data: {
          name: dto.variantName ?? undefined,
          priceAmount: dto.priceAmount ?? undefined,
          sku: dto.sku ?? undefined
        }
      });
    }

    await this.syncProductImage(productId, dto);

    return this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: {
        category: true,
        imageAsset: true,
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

  async setProductStatus(productId: string, status: ProductStatus) {
    await this.ensureProduct(productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: { status },
      include: {
        category: true,
        imageAsset: true,
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

  async deleteProduct(productId: string) {
    await this.ensureProduct(productId);
    await this.prisma.product.delete({
      where: { id: productId }
    });
    return { success: true };
  }

  private async ensureProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException("Product not found.");
    }

    return product;
  }

  private async syncProductImage(
    productId: string,
    dto: Pick<UpdateProductDto, "imageUrl" | "imageAltText" | "clearImage">
  ) {
    if (dto.clearImage) {
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          imageAssetId: null
        }
      });
      return;
    }

    if (!dto.imageUrl) {
      return;
    }

    const storageKey = `product:${productId}:primary`;
    const asset = await this.prisma.mediaAsset.upsert({
      where: { storageKey },
      update: {
        url: dto.imageUrl,
        altText: dto.imageAltText ?? undefined,
        mimeType: this.inferMimeType(dto.imageUrl)
      },
      create: {
        storageKey,
        url: dto.imageUrl,
        altText: dto.imageAltText ?? undefined,
        mimeType: this.inferMimeType(dto.imageUrl)
      }
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        imageAssetId: asset.id
      }
    });
  }

  private inferMimeType(url: string) {
    const normalized = url.toLowerCase();
    if (normalized.endsWith(".png")) return "image/png";
    if (normalized.endsWith(".webp")) return "image/webp";
    if (normalized.endsWith(".gif")) return "image/gif";
    return "image/jpeg";
  }
}
