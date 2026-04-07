import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ProductStatus } from "../../src/generated/prisma/index.js";
import { PrismaService } from "../prisma/prisma.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { CreateCartDto } from "./dto/create-cart.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCart(dto: CreateCartDto) {
    const location = await this.prisma.location.findUnique({
      where: { code: dto.locationCode }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    let diningTableId: string | undefined;
    if (dto.diningTableQrSlug) {
      const diningTable = await this.prisma.diningTable.findFirst({
        where: {
          qrSlug: dto.diningTableQrSlug,
          locationId: location.id,
          isActive: true
        }
      });

      if (!diningTable) {
        throw new NotFoundException("Dining table not found.");
      }

      diningTableId = diningTable.id;
    }

    const cart = await this.prisma.cart.create({
      data: {
        locationId: location.id,
        diningTableId,
        currencyCode: location.currencyCode
      }
    });

    return this.getCart(cart.id);
  }

  async getCart(cartId: string) {
    const cart = await this.loadCartOrThrow(cartId);
    return this.formatCart(cart);
  }

  async addItem(cartId: string, dto: AddCartItemDto) {
    const cart = await this.loadCartOrThrow(cartId);
    this.ensureCartIsEditable(cart.status);

    const resolvedItem = await this.resolveItemSelection({
      locationCode: cart.location?.code,
      productSlug: dto.productSlug,
      variantId: dto.variantId,
      quantity: dto.quantity,
      notes: dto.notes,
      selectedOptionIds: dto.selectedOptionIds ?? []
    });

    await this.prisma.$transaction(async tx => {
      const cartItem = await tx.cartItem.create({
        data: {
          cartId,
          productId: resolvedItem.product.id,
          productVariantId: resolvedItem.variant.id,
          quantity: dto.quantity,
          itemName: resolvedItem.product.name,
          unitPriceAmount: this.fromMinorUnits(resolvedItem.unitPriceMinor),
          lineTotalAmount: this.fromMinorUnits(resolvedItem.lineTotalMinor),
          notes: dto.notes,
          snapshot: resolvedItem.snapshot
        }
      });

      for (const option of resolvedItem.selectedOptions) {
        await tx.cartItemModifier.create({
          data: {
            cartItemId: cartItem.id,
            modifierGroupName: option.groupName,
            modifierOptionName: option.name,
            priceDeltaAmount: this.fromMinorUnits(option.priceDeltaMinor),
            snapshot: option.snapshot
          }
        });
      }

      await this.recalculateCart(cartId, tx);
    });

    return this.getCart(cartId);
  }

  async updateItem(cartId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.loadCartOrThrow(cartId);
    this.ensureCartIsEditable(cart.status);

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId
      }
    });

    if (!existingItem) {
      throw new NotFoundException("Cart item not found.");
    }

    if (!existingItem.productId) {
      throw new NotFoundException("Original product reference is missing.");
    }

    const product = await this.prisma.product.findUnique({
      where: { id: existingItem.productId },
      select: { slug: true }
    });

    if (!product?.slug) {
      throw new NotFoundException("Original product no longer exists.");
    }

    const resolvedItem = await this.resolveItemSelection({
      locationCode: cart.location?.code,
      productSlug: product.slug,
      variantId: existingItem.productVariantId ?? undefined,
      quantity: dto.quantity,
      notes: dto.notes,
      selectedOptionIds: dto.selectedOptionIds ?? []
    });

    await this.prisma.$transaction(async tx => {
      await tx.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: dto.quantity,
          notes: dto.notes,
          unitPriceAmount: this.fromMinorUnits(resolvedItem.unitPriceMinor),
          lineTotalAmount: this.fromMinorUnits(resolvedItem.lineTotalMinor),
          snapshot: resolvedItem.snapshot
        }
      });

      await tx.cartItemModifier.deleteMany({
        where: { cartItemId: itemId }
      });

      for (const option of resolvedItem.selectedOptions) {
        await tx.cartItemModifier.create({
          data: {
            cartItemId: itemId,
            modifierGroupName: option.groupName,
            modifierOptionName: option.name,
            priceDeltaAmount: this.fromMinorUnits(option.priceDeltaMinor),
            snapshot: option.snapshot
          }
        });
      }

      await this.recalculateCart(cartId, tx);
    });

    return this.getCart(cartId);
  }

  async removeItem(cartId: string, itemId: string) {
    const cart = await this.loadCartOrThrow(cartId);
    this.ensureCartIsEditable(cart.status);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId
      }
    });

    if (!item) {
      throw new NotFoundException("Cart item not found.");
    }

    await this.prisma.$transaction(async tx => {
      await tx.cartItem.delete({
        where: { id: itemId }
      });
      await this.recalculateCart(cartId, tx);
    });

    return this.getCart(cartId);
  }

  private ensureCartIsEditable(status: string) {
    if (status !== "active") {
      throw new BadRequestException("Only active carts can be changed.");
    }
  }

  private async loadCartOrThrow(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        location: true,
        diningTable: true,
        items: {
          orderBy: [{ createdAt: "asc" }],
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true
              }
            },
            productVariant: {
              select: {
                id: true,
                name: true
              }
            },
            modifiers: true
          }
        }
      }
    });

    if (!cart) {
      throw new NotFoundException("Cart not found.");
    }

    return cart;
  }

  private async resolveItemSelection(input: {
    locationCode?: string;
    productSlug: string;
    variantId?: string;
    quantity: number;
    notes?: string;
    selectedOptionIds: string[];
  }) {
    if (!input.locationCode) {
      throw new BadRequestException("Cart location is missing.");
    }

    const dedupedOptionIds = [...new Set(input.selectedOptionIds)];
    if (dedupedOptionIds.length !== input.selectedOptionIds.length) {
      throw new BadRequestException("Duplicate modifier selections are not allowed.");
    }

    const product = await this.prisma.product.findFirst({
      where: {
        slug: input.productSlug,
        status: ProductStatus.active,
        location: {
          code: input.locationCode
        }
      },
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
    });

    if (!product) {
      throw new NotFoundException("Product not found.");
    }

    const variant =
      (input.variantId
        ? product.variants.find(item => item.id === input.variantId)
        : undefined) ?? product.variants.find(item => item.isDefault) ?? product.variants[0];

    if (!variant) {
      throw new BadRequestException("No active variant is available for this product.");
    }

    const allowedOptions = new Map<
      string,
      {
        id: string;
        name: string;
        description: string | null;
        priceDeltaMinor: number;
        groupId: string;
        groupName: string;
      }
    >();

    for (const relation of product.modifierGroups) {
      const group = relation.modifierGroup;
      for (const option of group.options) {
        allowedOptions.set(option.id, {
          id: option.id,
          name: option.name,
          description: option.description,
          priceDeltaMinor: this.toMinorUnits(option.priceDeltaAmount),
          groupId: group.id,
          groupName: group.name
        });
      }
    }

    const selectedOptions = dedupedOptionIds.map(optionId => {
      const option = allowedOptions.get(optionId);
      if (!option) {
        throw new BadRequestException("A selected modifier option is invalid for this product.");
      }

      return {
        ...option,
        snapshot: {
          optionId: option.id,
          optionName: option.name,
          groupId: option.groupId,
          groupName: option.groupName,
          priceDeltaAmount: this.fromMinorUnits(option.priceDeltaMinor)
        }
      };
    });

    for (const relation of product.modifierGroups) {
      const group = relation.modifierGroup;
      const selectionCount = selectedOptions.filter(
        option => option.groupId === group.id
      ).length;

      if (selectionCount < group.minSelect) {
        throw new BadRequestException(
          `The modifier group "${group.name}" requires at least ${group.minSelect} selection(s).`
        );
      }

      if (selectionCount > group.maxSelect) {
        throw new BadRequestException(
          `The modifier group "${group.name}" allows at most ${group.maxSelect} selection(s).`
        );
      }

      if (group.isRequired && selectionCount === 0) {
        throw new BadRequestException(`The modifier group "${group.name}" is required.`);
      }
    }

    const unitPriceMinor =
      this.toMinorUnits(variant.priceAmount) +
      selectedOptions.reduce((sum, option) => sum + option.priceDeltaMinor, 0);
    const lineTotalMinor = unitPriceMinor * input.quantity;

    return {
      product,
      variant,
      selectedOptions,
      unitPriceMinor,
      lineTotalMinor,
      snapshot: {
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: variant.id,
        variantName: variant.name,
        notes: input.notes ?? null,
        selectedOptions: selectedOptions.map(option => option.snapshot)
      }
    };
  }

  private async recalculateCart(cartId: string, prisma: any) {
    const cart = await prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: {
        items: true
      }
    });

    const subtotalMinor = cart.items.reduce(
      (sum: number, item: { lineTotalAmount: unknown }) =>
        sum + this.toMinorUnits(item.lineTotalAmount),
      0
    );

    await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotalAmount: this.fromMinorUnits(subtotalMinor),
        discountAmount: "0.00",
        taxAmount: "0.00",
        totalAmount: this.fromMinorUnits(subtotalMinor)
      }
    });
  }

  private formatCart(cart: Awaited<ReturnType<CartsService["loadCartOrThrow"]>>) {
    return {
      id: cart.id,
      status: cart.status,
      currencyCode: cart.currencyCode,
      location: cart.location
        ? {
            id: cart.location.id,
            code: cart.location.code,
            name: cart.location.name
          }
        : null,
      diningTable: cart.diningTable
        ? {
            id: cart.diningTable.id,
            tableNumber: cart.diningTable.tableNumber,
            qrSlug: cart.diningTable.qrSlug
          }
        : null,
      subtotalAmount: this.toDisplayAmount(cart.subtotalAmount),
      discountAmount: this.toDisplayAmount(cart.discountAmount),
      taxAmount: this.toDisplayAmount(cart.taxAmount),
      totalAmount: this.toDisplayAmount(cart.totalAmount),
      items: cart.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        itemName: item.itemName,
        notes: item.notes,
        unitPriceAmount: this.toDisplayAmount(item.unitPriceAmount),
        lineTotalAmount: this.toDisplayAmount(item.lineTotalAmount),
        product: item.product,
        variant: item.productVariant,
        modifiers: item.modifiers.map(modifier => ({
          id: modifier.id,
          modifierGroupName: modifier.modifierGroupName,
          modifierOptionName: modifier.modifierOptionName,
          priceDeltaAmount: this.toDisplayAmount(modifier.priceDeltaAmount)
        })),
        snapshot: item.snapshot
      }))
    };
  }

  private toMinorUnits(value: unknown): number {
    return Math.round(Number(value ?? 0) * 100);
  }

  private fromMinorUnits(value: number): string {
    return (value / 100).toFixed(2);
  }

  private toDisplayAmount(value: unknown): number {
    return Number(Number(value ?? 0).toFixed(2));
  }
}
