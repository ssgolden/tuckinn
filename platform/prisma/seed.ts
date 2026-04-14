import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import {
  PrismaClient,
  ProductStatus,
  RoleCode,
  UserStatus
} from "../apps/api/src/generated/prisma/index.js";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), "../.env")
];

for (const candidate of envCandidates) {
  if (process.env.DATABASE_URL || !fs.existsSync(candidate)) {
    continue;
  }

  const rawEnv = fs.readFileSync(candidate, "utf8");
  for (const line of rawEnv.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured for seed.");
}

const pool = new Pool({
  connectionString
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool)
});

type SeedProduct = {
  slug: string;
  name: string;
  shortDescription: string;
  price: string;
  sortOrder: number;
  isFeatured?: boolean;
  configurable?: boolean;
};

type SeedCategory = {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  products: SeedProduct[];
};

const catalogSeed: SeedCategory[] = [
  {
    slug: "meal-deals",
    name: "Meal Deals",
    description: "Fast combinations for lunch rushes, collection runs, and group orders.",
    sortOrder: 1,
    products: [
      {
        slug: "meal-deal-lite",
        name: "Meal Deal Lite",
        shortDescription: "Premium sandwich, canned drink, chocolate, and crisps.",
        price: "9.95",
        sortOrder: 1,
        isFeatured: true
      },
      {
        slug: "meal-deal-classic",
        name: "Meal Deal Classic",
        shortDescription: "Deluxe sandwich, canned drink, and two snack items.",
        price: "13.95",
        sortOrder: 2
      },
      {
        slug: "meal-deal-feast",
        name: "Meal Deal Feast",
        shortDescription: "Two premium sandwiches, two canned drinks, and four snack items.",
        price: "19.95",
        sortOrder: 3
      },
      {
        slug: "meal-deal-mega",
        name: "Meal Deal Mega",
        shortDescription: "Four premium sandwiches, four drinks, eight snacks, and four beers.",
        price: "39.95",
        sortOrder: 4
      }
    ]
  },
  {
    slug: "originals",
    name: "Originals",
    description: "Signature house builds and the full custom sandwich range.",
    sortOrder: 2,
    products: [
      {
        slug: "traditional-sandwich",
        name: "Traditional Sandwich",
        shortDescription: "Classic quick-order sandwich from the core Tuckinn range.",
        price: "4.95",
        sortOrder: 1
      },
      {
        slug: "tuckinn-proper-original",
        name: "Tuckinn Proper Original",
        shortDescription: "House signature sandwich with full custom build options.",
        price: "9.95",
        sortOrder: 2,
        isFeatured: true,
        configurable: true
      },
      {
        slug: "build-your-own-sandwich",
        name: "Build Your Own Sandwich",
        shortDescription: "Start with the base build and make it your own.",
        price: "6.45",
        sortOrder: 3,
        isFeatured: true,
        configurable: true
      },
      {
        slug: "deluxe-house-stack",
        name: "Deluxe House Stack",
        shortDescription: "A larger signature build with room for extra fillings.",
        price: "8.95",
        sortOrder: 4,
        configurable: true
      }
    ]
  },
  {
    slug: "smoothies",
    name: "Smoothies",
    description: "Fresh blends with premium fruit-forward flavour.",
    sortOrder: 3,
    products: [
      {
        slug: "berry-bliss",
        name: "Berry Bliss",
        shortDescription: "Blueberries, raspberries, strawberries, and banana.",
        price: "4.95",
        sortOrder: 1,
        isFeatured: true
      },
      {
        slug: "tropical-escape",
        name: "Tropical Escape",
        shortDescription: "Mango, pineapple, coconut water, and lime.",
        price: "4.95",
        sortOrder: 2
      },
      {
        slug: "green-goddess",
        name: "Green Goddess",
        shortDescription: "Spinach, kale, green apple, and avocado.",
        price: "4.95",
        sortOrder: 3
      },
      {
        slug: "strawberry-banana",
        name: "Strawberry Banana",
        shortDescription: "Classic creamy smoothie that works all day.",
        price: "4.95",
        sortOrder: 4
      },
      {
        slug: "citrus-mango-smoothie",
        name: "Citrus Mango Smoothie",
        shortDescription: "Orange juice and mango with a bright finish.",
        price: "4.95",
        sortOrder: 5
      }
    ]
  },
  {
    slug: "milkshakes",
    name: "Milkshakes",
    description: "Thick indulgent shakes finished fresh to order.",
    sortOrder: 4,
    products: [
      {
        slug: "chocolate-milkshake",
        name: "Chocolate Milkshake",
        shortDescription: "Thick and creamy chocolate shake.",
        price: "4.45",
        sortOrder: 1
      },
      {
        slug: "vanilla-milkshake",
        name: "Vanilla Milkshake",
        shortDescription: "Classic creamy vanilla.",
        price: "4.45",
        sortOrder: 2
      },
      {
        slug: "strawberry-milkshake",
        name: "Strawberry Milkshake",
        shortDescription: "Sweet strawberry with a rich finish.",
        price: "4.45",
        sortOrder: 3
      },
      {
        slug: "banana-milkshake",
        name: "Banana Milkshake",
        shortDescription: "Smooth banana flavour with a thick texture.",
        price: "4.45",
        sortOrder: 4
      },
      {
        slug: "cookies-and-cream",
        name: "Cookies and Cream",
        shortDescription: "Crushed cookie blend folded into vanilla shake.",
        price: "4.45",
        sortOrder: 5
      }
    ]
  },
  {
    slug: "drinks-and-coffees",
    name: "Drinks & Coffees",
    description: "Coffee bar staples, juices, canned drinks, and house favourites.",
    sortOrder: 5,
    products: [
      { slug: "canned-soft-drink", name: "Canned Soft Drink", shortDescription: "Coke, Coke Zero, Fanta Orange, Fanta Lemon, Sprite, or Aquarius.", price: "1.60", sortOrder: 1 },
      { slug: "fruit-juice", name: "Fruit Juice", shortDescription: "Orange, apple, or pineapple juice.", price: "2.50", sortOrder: 2 },
      { slug: "water", name: "Water", shortDescription: "Still or sparkling bottled water.", price: "1.25", sortOrder: 3 },
      { slug: "tea", name: "Tea", shortDescription: "Classic everyday brew.", price: "1.50", sortOrder: 4 },
      { slug: "english-tea", name: "English Tea", shortDescription: "Traditional English breakfast tea.", price: "1.45", sortOrder: 5 },
      { slug: "herbal-tea", name: "Herbal Tea", shortDescription: "Calming herbal infusion.", price: "1.75", sortOrder: 6 },
      { slug: "cafe-con-leche", name: "Cafe Con Leche", shortDescription: "Classic Spanish milk coffee.", price: "1.50", sortOrder: 7 },
      { slug: "cortado", name: "Cortado", shortDescription: "Espresso with a dash of milk.", price: "1.50", sortOrder: 8 },
      { slug: "americano", name: "Americano", shortDescription: "Black coffee with a clean finish.", price: "1.50", sortOrder: 9 },
      { slug: "cappuccino", name: "Cappuccino", shortDescription: "Frothy and rich coffee shop standard.", price: "3.25", sortOrder: 10 },
      { slug: "bombon", name: "Bombon", shortDescription: "Espresso with sweet condensed milk.", price: "2.50", sortOrder: 11 },
      { slug: "belmonte", name: "Belmonte", shortDescription: "Bombon finished with a dash of brandy.", price: "2.95", sortOrder: 12 },
      { slug: "brandy-coffee", name: "Brandy Coffee", shortDescription: "Warming and strong after-lunch coffee.", price: "2.95", sortOrder: 13 },
      { slug: "hot-chocolate", name: "Hot Chocolate", shortDescription: "Thick Spanish-style hot chocolate.", price: "2.50", sortOrder: 14 }
    ]
  },
  {
    slug: "snacks-and-sweets",
    name: "Snacks & Sweets",
    description: "Impulse buys, side add-ons, and basket fillers.",
    sortOrder: 6,
    products: [
      { slug: "crisps", name: "Crisps", shortDescription: "Assorted flavours for lunch add-ons.", price: "1.50", sortOrder: 1 },
      { slug: "chocolate-bars", name: "Chocolate Bars", shortDescription: "Popular chocolate selections.", price: "1.50", sortOrder: 2 },
      { slug: "packs-of-sweets", name: "Packs of Sweets", shortDescription: "Gummy and sweet treat packs.", price: "1.50", sortOrder: 3 }
    ]
  }
];

const modifierSeed = [
  {
    name: "Bread Choice",
    description: "Choose the bread or base for your sandwich build.",
    minSelect: 1,
    maxSelect: 1,
    sortOrder: 1,
    isRequired: true,
    options: [
      { name: "White Bread", sortOrder: 1, isDefault: true },
      { name: "Brown Bread", sortOrder: 2 },
      { name: "White Roll", sortOrder: 3 },
      { name: "Brown Roll", sortOrder: 4 },
      { name: "Baguette", sortOrder: 5, priceDeltaAmount: "0.50" },
      { name: "Wrap", sortOrder: 6, priceDeltaAmount: "0.50" },
      { name: "Pitta Bread", sortOrder: 7, priceDeltaAmount: "0.50" },
      { name: "Bagel", sortOrder: 8, priceDeltaAmount: "0.75" },
      { name: "Bakers Bread Of The Day", sortOrder: 9, priceDeltaAmount: "0.75" }
    ]
  },
  {
    name: "Protein",
    description: "Choose the main filling for the sandwich.",
    minSelect: 1,
    maxSelect: 2,
    sortOrder: 2,
    isRequired: true,
    options: [
      { name: "Chicken", sortOrder: 1, isDefault: true },
      { name: "Roast Beef", sortOrder: 2 },
      { name: "Corn Beef", sortOrder: 3 },
      { name: "Tuna", sortOrder: 4 },
      { name: "Smoked Salmon", sortOrder: 5, priceDeltaAmount: "1.50" },
      { name: "Egg", sortOrder: 6 },
      { name: "Bacon", sortOrder: 7, priceDeltaAmount: "0.75" },
      { name: "Sausage", sortOrder: 8, priceDeltaAmount: "0.75" },
      { name: "Honey Roast Ham", sortOrder: 9 },
      { name: "Ham", sortOrder: 10 },
      { name: "Palma Ham", sortOrder: 11, priceDeltaAmount: "1.00" },
      { name: "Chorizo", sortOrder: 12, priceDeltaAmount: "0.75" },
      { name: "Salami", sortOrder: 13, priceDeltaAmount: "0.75" },
      { name: "Pork", sortOrder: 14 },
      { name: "Pulled Pork", sortOrder: 15, priceDeltaAmount: "1.00" },
      { name: "Prawns", sortOrder: 16, priceDeltaAmount: "1.50" }
    ]
  },
  {
    name: "Add Cheese",
    description: "Add one or two cheeses to finish the build.",
    minSelect: 0,
    maxSelect: 2,
    sortOrder: 3,
    isRequired: false,
    options: [
      { name: "Cheddar", sortOrder: 1, priceDeltaAmount: "1.00" },
      { name: "Feta", sortOrder: 2, priceDeltaAmount: "1.00" },
      { name: "Cream Cheese", sortOrder: 3, priceDeltaAmount: "1.00" },
      { name: "Gouda", sortOrder: 4, priceDeltaAmount: "1.00" },
      { name: "Mozzarella", sortOrder: 5, priceDeltaAmount: "1.00" }
    ]
  },
  {
    name: "Fresh Veg",
    description: "Choose fresh veg and salad fillings.",
    minSelect: 1,
    maxSelect: 4,
    sortOrder: 4,
    isRequired: true,
    options: [
      { name: "Lettuce", sortOrder: 1, isDefault: true },
      { name: "Tomato", sortOrder: 2 },
      { name: "Red Onion", sortOrder: 3 },
      { name: "Cucumber", sortOrder: 4 },
      { name: "Sweetcorn", sortOrder: 5 },
      { name: "Spinach", sortOrder: 6 },
      { name: "Rocket", sortOrder: 7 },
      { name: "Grated Carrot", sortOrder: 8 },
      { name: "Peppers", sortOrder: 9 },
      { name: "Beetroot", sortOrder: 10 },
      { name: "Mushrooms", sortOrder: 11 },
      { name: "Garlic", sortOrder: 12 },
      { name: "Olives", sortOrder: 13 },
      { name: "Celery", sortOrder: 14 },
      { name: "Avocado", sortOrder: 15, priceDeltaAmount: "1.00" },
      { name: "Jalapenos", sortOrder: 16 }
    ]
  },
  {
    name: "Signature Sauces",
    description: "Choose one or two sauces to finish the sandwich.",
    minSelect: 1,
    maxSelect: 2,
    sortOrder: 5,
    isRequired: true,
    options: [
      { name: "Mayonnaise", sortOrder: 1, isDefault: true },
      { name: "Alioli", sortOrder: 2 },
      { name: "English Mustard", sortOrder: 3 },
      { name: "Dijon Mustard", sortOrder: 4 },
      { name: "Horseradish", sortOrder: 5 },
      { name: "Mint Sauce", sortOrder: 6 },
      { name: "Cranberry Sauce", sortOrder: 7 },
      { name: "Tomato Ketchup", sortOrder: 8 },
      { name: "Brown Sauce", sortOrder: 9 },
      { name: "Bbq Sauce", sortOrder: 10 },
      { name: "Salad Dressing", sortOrder: 11 },
      { name: "Salad Cream", sortOrder: 12 },
      { name: "Pesto", sortOrder: 13 },
      { name: "Ranch Sauce", sortOrder: 14 },
      { name: "Sweet Chilli", sortOrder: 15 },
      { name: "Hot Sauce", sortOrder: 16 },
      { name: "Branston Pickle", sortOrder: 17 }
    ]
  },
  {
    name: "Premium Extras",
    description: "Optional premium add-ons for bigger basket value.",
    minSelect: 0,
    maxSelect: 4,
    sortOrder: 6,
    isRequired: false,
    options: [
      { name: "Extra Protein", sortOrder: 1, priceDeltaAmount: "2.50" },
      { name: "Cheddar Upgrade", sortOrder: 2, priceDeltaAmount: "1.25" },
      { name: "Avocado Upgrade", sortOrder: 3, priceDeltaAmount: "1.25" },
      { name: "Crispy Onions", sortOrder: 4, priceDeltaAmount: "0.75" }
    ]
  }
];

async function ensureRoles() {
  const entries: Array<{ code: RoleCode; name: string }> = [
    { code: RoleCode.owner, name: "Owner" },
    { code: RoleCode.admin, name: "Admin" },
    { code: RoleCode.manager, name: "Manager" },
    { code: RoleCode.staff, name: "Staff" },
    { code: RoleCode.customer, name: "Customer" }
  ];

  for (const entry of entries) {
    await prisma.role.upsert({
      where: { code: entry.code },
      update: { name: entry.name },
      create: entry
    });
  }
}

async function ensureLocation() {
  return prisma.location.upsert({
    where: { code: "main" },
    update: {
      name: "Tuckinn Proper Main Location"
    },
    create: {
      code: "main",
      name: "Tuckinn Proper Main Location",
      timezone: "Europe/Madrid",
      currencyCode: "EUR"
    }
  });
}

async function ensureAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      passwordHash,
      status: UserStatus.active,
      firstName: "Platform",
      lastName: "Admin"
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      status: UserStatus.active,
      firstName: "Platform",
      lastName: "Admin",
      staffProfile: {
        create: {
          displayName: "Platform Admin"
        }
      }
    }
  });

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: RoleCode.admin }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id
    }
  });

  return user;
}

async function ensureCatalog(locationId: string) {
  for (const category of catalogSeed) {
    const categoryRecord = await prisma.category.upsert({
      where: {
        locationId_slug: {
          locationId,
          slug: category.slug
        }
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isVisible: true
      },
      create: {
        locationId,
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isVisible: true
      }
    });

    for (const product of category.products) {
      const productRecord = await prisma.product.upsert({
        where: {
          locationId_slug: {
            locationId,
            slug: product.slug
          }
        },
        update: {
          categoryId: categoryRecord.id,
          name: product.name,
          shortDescription: product.shortDescription,
          isFeatured: product.isFeatured ?? false,
          sortOrder: product.sortOrder,
          status: ProductStatus.active
        },
        create: {
          locationId,
          categoryId: categoryRecord.id,
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          isFeatured: product.isFeatured ?? false,
          sortOrder: product.sortOrder,
          status: ProductStatus.active
        }
      });

      const defaultVariant = await prisma.productVariant.findFirst({
        where: {
          productId: productRecord.id,
          isDefault: true
        }
      });

      if (defaultVariant) {
        await prisma.productVariant.update({
          where: { id: defaultVariant.id },
          data: {
            name: "Default",
            priceAmount: product.price,
            isActive: true
          }
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId: productRecord.id,
            name: "Default",
            priceAmount: product.price,
            isDefault: true,
            isActive: true
          }
        });
      }
    }
  }
}

async function ensureModifierGroup(
  locationId: string,
  input: {
    name: string;
    description?: string;
    minSelect: number;
    maxSelect: number;
    sortOrder: number;
    isRequired: boolean;
    options: Array<{
      name: string;
      description?: string;
      priceDeltaAmount?: string;
      sortOrder: number;
      isDefault?: boolean;
    }>;
  }
) {
  const existingGroup = await prisma.modifierGroup.findFirst({
    where: {
      locationId,
      name: input.name
    }
  });

  const modifierGroup = existingGroup
    ? await prisma.modifierGroup.update({
        where: { id: existingGroup.id },
        data: {
          description: input.description,
          minSelect: input.minSelect,
          maxSelect: input.maxSelect,
          sortOrder: input.sortOrder,
          isRequired: input.isRequired
        }
      })
    : await prisma.modifierGroup.create({
        data: {
          locationId,
          name: input.name,
          description: input.description,
          minSelect: input.minSelect,
          maxSelect: input.maxSelect,
          sortOrder: input.sortOrder,
          isRequired: input.isRequired
        }
      });

  for (const option of input.options) {
    const existingOption = await prisma.modifierOption.findFirst({
      where: {
        modifierGroupId: modifierGroup.id,
        name: option.name
      }
    });

    if (existingOption) {
      await prisma.modifierOption.update({
        where: { id: existingOption.id },
        data: {
          description: option.description,
          priceDeltaAmount: option.priceDeltaAmount ?? "0",
          sortOrder: option.sortOrder,
          isDefault: option.isDefault ?? false,
          isActive: true
        }
      });
    } else {
      await prisma.modifierOption.create({
        data: {
          modifierGroupId: modifierGroup.id,
          name: option.name,
          description: option.description,
          priceDeltaAmount: option.priceDeltaAmount ?? "0",
          sortOrder: option.sortOrder,
          isDefault: option.isDefault ?? false,
          isActive: true
        }
      });
    }
  }

  await prisma.modifierOption.deleteMany({
    where: {
      modifierGroupId: modifierGroup.id,
      name: {
        notIn: input.options.map(option => option.name)
      }
    }
  });

  return modifierGroup;
}

async function ensureModifiers(locationId: string) {
  const modifierGroups = [];

  for (const group of modifierSeed) {
    modifierGroups.push(await ensureModifierGroup(locationId, group));
  }

  const configurableSlugs = catalogSeed
    .flatMap(category => category.products)
    .filter(product => product.configurable)
    .map(product => product.slug);

  for (const slug of configurableSlugs) {
    const product = await prisma.product.findFirst({
      where: {
        locationId,
        slug
      }
    });

    if (!product) {
      continue;
    }

    await prisma.productModifierGroup.deleteMany({
      where: {
        productId: product.id,
        modifierGroup: {
          locationId,
          name: {
            notIn: modifierGroups.map(group => group.name)
          }
        }
      }
    });

    for (const group of modifierGroups) {
      await prisma.productModifierGroup.upsert({
        where: {
          productId_modifierGroupId: {
            productId: product.id,
            modifierGroupId: group.id
          }
        },
        update: {
          sortOrder: group.sortOrder
        },
        create: {
          productId: product.id,
          modifierGroupId: group.id,
          sortOrder: group.sortOrder
        }
      });
    }
  }
}

async function main() {
  await ensureRoles();
  const location = await ensureLocation();
  await ensureAdminUser();
  await ensureCatalog(location.id);
  await ensureModifiers(location.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
