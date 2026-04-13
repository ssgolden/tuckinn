import {
  ConflictException,
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

  async getCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundException("Category not found.");
    }

    return category;
  }

  async listProducts(locationCode?: string, categorySlug?: string, search?: string, status?: ProductStatus) {
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
          : {}),
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { shortDescription: { contains: search, mode: "insensitive" } },
                { longDescription: { contains: search, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: this.productInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });

    return products.map(product => this.formatProduct(product));
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

  async deleteCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundException("Category not found.");
    }

    const productCount = await this.prisma.product.count({
      where: { categoryId }
    });

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete category: ${productCount} product(s) reference this category.`
      );
    }

    await this.prisma.category.delete({ where: { id: categoryId } });
    return { success: true };
  }

  async getProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: this.productInclude
    });

    if (!product) {
      throw new NotFoundException("Product not found.");
    }

    return this.formatProduct(product);
  }

  private readonly productInclude = {
    category: true,
    imageAsset: true,
    variants: {
      orderBy: [{ isDefault: "desc" as const }, { priceAmount: "asc" as const }]
    },
    modifierGroups: {
      include: {
        modifierGroup: {
          include: {
            options: {
              orderBy: [{ sortOrder: "asc" as const }, { name: "asc" as const }]
            }
          }
        }
      },
      orderBy: [{ sortOrder: "asc" as const }]
    }
  };

  private formatProduct(product: any) {
    return {
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
      createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : null,
      category: product.category
        ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
        : null,
      variants: product.variants.map((variant: any) => ({
        id: variant.id,
        name: variant.name,
        priceAmount: Number(variant.priceAmount),
        isDefault: variant.isDefault,
        sku: variant.sku
      })),
      modifierGroups: product.modifierGroups.map((entry: any) => ({
        id: entry.modifierGroup.id,
        name: entry.modifierGroup.name,
        description: entry.modifierGroup.description,
        minSelect: entry.modifierGroup.minSelect,
        maxSelect: entry.modifierGroup.maxSelect,
        isRequired: entry.modifierGroup.isRequired,
        sortOrder: entry.sortOrder,
        options: entry.modifierGroup.options.map((option: any) => ({
          id: option.id,
          name: option.name,
          priceDeltaAmount: Number(option.priceDeltaAmount),
          isDefault: option.isDefault,
          isActive: option.isActive,
          sortOrder: option.sortOrder
        }))
      }))
    };
  }

  async createProduct(dto: CreateProductDto) {
    const location = await this.prisma.location.findUnique({
      where: { code: dto.locationCode }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    let categoryId: string | undefined;
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId }
      });
      if (!category) {
        throw new NotFoundException("Category not found.");
      }
      categoryId = category.id;
    } else if (dto.categorySlug) {
      const category = await this.prisma.category.findFirst({
        where: {
          slug: dto.categorySlug,
          locationId: location.id
        }
      });
      if (!category) {
        throw new NotFoundException("Category not found.");
      }
      categoryId = category.id;
    }

    const product = await this.prisma.product.upsert({
      where: {
        locationId_slug: {
          locationId: location.id,
          slug: dto.slug
        }
      },
      update: {
        categoryId: categoryId ?? undefined,
        name: dto.name,
        shortDescription: dto.shortDescription,
        longDescription: dto.longDescription,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        status: ProductStatus.active
      },
      create: {
        locationId: location.id,
        categoryId: categoryId ?? undefined,
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

    const created = await this.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: this.productInclude
    });

    return this.formatProduct(created);
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

    let categoryId: string | null | undefined;
    if (dto.categoryId) {
      categoryId = dto.categoryId;
    } else if (dto.categoryId === null) {
      categoryId = null;
    } else if (dto.categorySlug) {
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
        ...(categoryId === null ? { categoryId: null } : categoryId ? { categoryId } : {}),
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

    const updated = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: this.productInclude
    });

    return this.formatProduct(updated);
  }

  async setProductStatus(productId: string, status: ProductStatus) {
    await this.ensureProduct(productId);
    await this.prisma.product.update({
      where: { id: productId },
      data: { status }
    });
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: this.productInclude
    });
    return this.formatProduct(product);
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
