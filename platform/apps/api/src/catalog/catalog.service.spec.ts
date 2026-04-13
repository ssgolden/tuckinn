import { ConflictException, NotFoundException } from "@nestjs/common";
import { ProductStatus } from "../../src/generated/prisma/index.js";
import { CatalogService } from "./catalog.service";

describe("CatalogService", () => {
  let service: CatalogService;
  let prisma: Record<string, any>;

  beforeEach(() => {
    prisma = {
      location: { findUnique: jest.fn() },
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      productVariant: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
      },
      mediaAsset: {
        upsert: jest.fn()
      }
    };
    service = new CatalogService(prisma as never);
  });

  describe("getPublicCatalog", () => {
    it("throws NotFoundException if location not found", async () => {
      prisma.location.findUnique.mockResolvedValue(null);

      await expect(service.getPublicCatalog("bad-location")).rejects.toThrow(
        NotFoundException
      );
    });

    it("returns mapped catalog with categories and products", async () => {
      prisma.location.findUnique.mockResolvedValue({
        code: "main",
        name: "Main Location",
        categories: [
          {
            id: "cat-1",
            slug: "drinks",
            name: "Drinks",
            description: "Beverages",
            sortOrder: 0,
            isVisible: true,
            products: [
              {
                id: "prod-1",
                slug: "latte",
                name: "Latte",
                shortDescription: "Coffee",
                longDescription: "A nice coffee",
                status: ProductStatus.active,
                isFeatured: false,
                sortOrder: 0,
                imageAsset: { url: "https://img.test/latte.jpg", altText: "Latte" },
                variants: [
                  { id: "v-1", name: "Regular", priceAmount: 3.5, isDefault: true, sku: "LAT-R" }
                ],
                modifierGroups: []
              }
            ]
          }
        ]
      });

      const result = await service.getPublicCatalog("main");

      expect(result.location.code).toBe("main");
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].products).toHaveLength(1);
      expect(result.categories[0].products[0].imageUrl).toBe("https://img.test/latte.jpg");
      expect(result.categories[0].products[0].variants[0].priceAmount).toBe(3.5);
    });

    it("filters out invisible categories and inactive products", async () => {
      // The Prisma query uses `where: { isVisible: true }` for categories
      // and `where: { status: ProductStatus.active }` for products
      // so the service itself doesn't filter - Prisma does.
      // We verify the query is structured correctly by checking that
      // findUnique is called with the right include structure.
      prisma.location.findUnique.mockResolvedValue({
        code: "main",
        name: "Main",
        categories: []
      });

      await service.getPublicCatalog("main");

      const call = prisma.location.findUnique.mock.calls[0][0];
      expect(call.where).toEqual({ code: "main" });
      expect(call.include.categories.where.isVisible).toBe(true);
      expect(call.include.categories.include.products.where.status).toBe(ProductStatus.active);
    });
  });

  describe("listCategories", () => {
    it("returns all categories when no locationCode filter", async () => {
      prisma.category.findMany.mockResolvedValue([
        { id: "cat-1", name: "Drinks" }
      ]);

      const result = await service.listCategories();

      expect(result).toHaveLength(1);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
        })
      );
    });

    it("filters by locationCode when provided", async () => {
      prisma.category.findMany.mockResolvedValue([]);

      await service.listCategories("main");

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { location: { code: "main" } }
        })
      );
    });
  });

  describe("createCategory", () => {
    it("throws NotFoundException if location not found", async () => {
      prisma.location.findUnique.mockResolvedValue(null);

      await expect(
        service.createCategory({
          locationCode: "bad",
          slug: "test",
          name: "Test",
          description: null
        })
      ).rejects.toThrow(NotFoundException);
    });

    it("upserts category with correct data", async () => {
      prisma.location.findUnique.mockResolvedValue({ id: "loc-1", code: "main" });
      prisma.category.upsert.mockResolvedValue({ id: "cat-1", slug: "drinks" });

      await service.createCategory({
        locationCode: "main",
        slug: "drinks",
        name: "Drinks",
        description: "Beverages",
        sortOrder: 5,
        isVisible: false
      });

      expect(prisma.category.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { locationId_slug: { locationId: "loc-1", slug: "drinks" } },
          create: expect.objectContaining({
            name: "Drinks",
            sortOrder: 5,
            isVisible: false
          }),
          update: expect.objectContaining({
            name: "Drinks",
            sortOrder: 5,
            isVisible: false
          })
        })
      );
    });

    it("defaults sortOrder to 0 and isVisible to true when not provided", async () => {
      prisma.location.findUnique.mockResolvedValue({ id: "loc-1", code: "main" });
      prisma.category.upsert.mockResolvedValue({});

      await service.createCategory({
        locationCode: "main",
        slug: "food",
        name: "Food",
        description: null
      });

      const call = prisma.category.upsert.mock.calls[0][0];
      expect(call.create.sortOrder).toBe(0);
      expect(call.create.isVisible).toBe(true);
    });
  });

  describe("updateCategory", () => {
    it("throws NotFoundException if category not found", async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCategory("bad-id", { name: "New Name" })
      ).rejects.toThrow(NotFoundException);
    });

    it("updates only provided fields", async () => {
      prisma.category.findUnique.mockResolvedValue({ id: "cat-1" });
      prisma.category.update.mockResolvedValue({ id: "cat-1", name: "Updated" });

      await service.updateCategory("cat-1", { name: "Updated" });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: expect.objectContaining({
          name: "Updated",
          slug: undefined,
          description: undefined
        })
      });
    });
  });

  describe("deleteCategory", () => {
    it("throws NotFoundException if category not found", async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.deleteCategory("bad-id")).rejects.toThrow(
        NotFoundException
      );
    });

    it("throws ConflictException if category has products", async () => {
      prisma.category.findUnique.mockResolvedValue({ id: "cat-1" });
      prisma.product.count.mockResolvedValue(3);

      await expect(service.deleteCategory("cat-1")).rejects.toThrow(
        ConflictException
      );
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it("deletes category when it has no products", async () => {
      prisma.category.findUnique.mockResolvedValue({ id: "cat-1" });
      prisma.product.count.mockResolvedValue(0);
      prisma.category.delete.mockResolvedValue({});

      const result = await service.deleteCategory("cat-1");

      expect(result).toEqual({ success: true });
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
    });
  });

  describe("createProduct", () => {
    it("throws NotFoundException if location not found", async () => {
      prisma.location.findUnique.mockResolvedValue(null);

      await expect(
        service.createProduct({
          categorySlug: "drinks",
          locationCode: "bad",
          slug: "test",
          name: "Test",
          shortDescription: "",
          longDescription: "",
          variantName: "Regular",
          sku: "SKU1",
          priceAmount: 10
        })
      ).rejects.toThrow(NotFoundException);
    });

    it("creates a new product with default variant when none exists", async () => {
      const location = { id: "loc-1", code: "main" };
      prisma.location.findUnique.mockResolvedValue(location);
      prisma.category.findFirst.mockResolvedValue({
        id: "cat-1",
        locationId: "loc-1"
      });
      prisma.product.upsert.mockResolvedValue({ id: "prod-1" });
      prisma.productVariant.findFirst.mockResolvedValue(null);
      prisma.productVariant.create.mockResolvedValue({ id: "v-1" });
      prisma.product.findUniqueOrThrow.mockResolvedValue({
        id: "prod-1",
        name: "Latte",
        category: { id: "cat-1" },
        imageAsset: null,
        variants: [],
        modifierGroups: []
      });

      await service.createProduct({
        categorySlug: "drinks",
        locationCode: "main",
        slug: "latte",
        name: "Latte",
        shortDescription: "Coffee drink",
        longDescription: "A nice latte",
        variantName: "Regular",
        sku: "LAT-R",
        priceAmount: 3.5
      });

      expect(prisma.productVariant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Regular",
            sku: "LAT-R",
            priceAmount: 3.5,
            isDefault: true,
            isActive: true
          })
        })
      );
    });

    it("updates existing default variant when one exists", async () => {
      const location = { id: "loc-1", code: "main" };
      prisma.location.findUnique.mockResolvedValue(location);
      prisma.category.findFirst.mockResolvedValue({
        id: "cat-1",
        locationId: "loc-1"
      });
      prisma.product.upsert.mockResolvedValue({ id: "prod-1" });
      prisma.productVariant.findFirst.mockResolvedValue({ id: "v-1", isDefault: true });
      prisma.productVariant.update.mockResolvedValue({ id: "v-1" });
      prisma.product.findUniqueOrThrow.mockResolvedValue({
        id: "prod-1",
        category: { id: "cat-1" },
        imageAsset: null,
        variants: [],
        modifierGroups: []
      });

      await service.createProduct({
        categorySlug: "drinks",
        locationCode: "main",
        slug: "latte",
        name: "Latte",
        shortDescription: "",
        longDescription: "",
        variantName: "Large",
        sku: "LAT-L",
        priceAmount: 4.5
      });

      expect(prisma.productVariant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "v-1" },
          data: expect.objectContaining({
            name: "Large",
            sku: "LAT-L",
            priceAmount: 4.5,
            isActive: true
          })
        })
      );
      expect(prisma.productVariant.create).not.toHaveBeenCalled();
    });
  });

  describe("setProductStatus", () => {
    it("throws NotFoundException if product not found", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.setProductStatus("bad-id", ProductStatus.archived)
      ).rejects.toThrow(NotFoundException);
    });

    it("updates product status", async () => {
      prisma.product.findUnique.mockResolvedValue({ id: "prod-1" });
      prisma.product.update.mockResolvedValue({});
      const fullProduct = {
        id: "prod-1",
        slug: "latte",
        name: "Latte",
        status: ProductStatus.archived,
        category: { id: "cat-1", name: "Drinks", slug: "drinks" },
        imageAsset: null,
        variants: [],
        modifierGroups: []
      };
      prisma.product.findUniqueOrThrow.mockResolvedValue(fullProduct);

      const result = await service.setProductStatus("prod-1", ProductStatus.archived);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { status: ProductStatus.archived }
      });
      expect(result.id).toBe("prod-1");
    });
  });

  describe("deleteProduct", () => {
    it("throws NotFoundException if product not found", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.deleteProduct("bad-id")).rejects.toThrow(
        NotFoundException
      );
    });

    it("deletes product and returns success", async () => {
      prisma.product.findUnique.mockResolvedValue({ id: "prod-1" });
      prisma.product.delete.mockResolvedValue({});

      const result = await service.deleteProduct("prod-1");

      expect(result).toEqual({ success: true });
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: "prod-1" } });
    });
  });
});