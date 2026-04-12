import type { CartResponse, PublicCatalogResponse } from "../../lib/api";

export type ProductSelectionState = {
  selectedOptionIds: string[];
  notes: string;
};

export type Category = PublicCatalogResponse["categories"][number];
export type Product = Category["products"][number];
export type ModifierGroup = Product["modifierGroups"][number];
export type StorefrontView = "home" | "menu" | "builder" | "basket" | "access";
export type MenuFilter = "all" | "quick" | "build" | "featured";

export const MENU_FILTERS: Array<{ value: MenuFilter; label: string }> = [
  { value: "all", label: "All items" },
  { value: "quick", label: "Quick order" },
  { value: "build", label: "Custom builds" },
  { value: "featured", label: "Featured" }
];

export function buildInitialSelections(catalog: PublicCatalogResponse) {
  return Object.fromEntries(
    catalog.categories.flatMap(category =>
      category.products.map(product => [
        product.id,
        { selectedOptionIds: getDefaultOptionIds(product), notes: "" }
      ])
    )
  ) as Record<string, ProductSelectionState>;
}

export function getDefaultOptionIds(product: Product) {
  return product.modifierGroups.flatMap(group => {
    const defaults = group.options.filter(option => option.isDefault).map(option => option.id);
    if (defaults.length > 0) {
      return defaults.slice(0, group.maxSelect);
    }
    if (group.isRequired && group.options[0]) {
      return [group.options[0].id];
    }
    return [];
  });
}

export function getSelectedCount(group: ModifierGroup, selectedOptionIds: string[]) {
  const groupIds = group.options.map(option => option.id);
  return selectedOptionIds.filter(id => groupIds.includes(id)).length;
}

export function getMissingGroups(product: Product, selection: ProductSelectionState) {
  return product.modifierGroups
    .filter(group => getSelectedCount(group, selection.selectedOptionIds) < group.minSelect)
    .map(group => group.name);
}

export function getSelectionLabel(group: ModifierGroup, selectedOptionIds: string[]) {
  const labels = group.options
    .filter(option => selectedOptionIds.includes(option.id))
    .map(option => option.name);
  if (labels.length === 0) {
    return group.isRequired ? "Required selection pending" : "No selection";
  }
  return labels.join(", ");
}

export function getProductPrice(product: Product, selection: ProductSelectionState) {
  const basePrice =
    product.variants.find(variant => variant.isDefault)?.priceAmount ??
    product.variants[0]?.priceAmount ??
    0;
  const premium = product.modifierGroups
    .flatMap(group => group.options)
    .filter(option => selection.selectedOptionIds.includes(option.id))
    .reduce((sum, option) => sum + option.priceDeltaAmount, 0);
  return basePrice + premium;
}

export function getFilteredProducts(category: Category | null, filter: MenuFilter) {
  if (!category) {
    return [];
  }

  switch (filter) {
    case "quick":
      return category.products.filter(product => product.modifierGroups.length === 0);
    case "build":
      return category.products.filter(product => product.modifierGroups.length > 0);
    case "featured":
      return category.products.filter(product => product.isFeatured);
    default:
      return category.products;
  }
}

export function getMerchandisedProducts(category: Category | null, filter: MenuFilter) {
  const filtered = getFilteredProducts(category, filter);

  return [...filtered].sort((left, right) => {
    const leftFeatured = left.isFeatured ? 1 : 0;
    const rightFeatured = right.isFeatured ? 1 : 0;
    if (leftFeatured !== rightFeatured) {
      return rightFeatured - leftFeatured;
    }

    const leftQuick = left.modifierGroups.length === 0 ? 1 : 0;
    const rightQuick = right.modifierGroups.length === 0 ? 1 : 0;
    if (leftQuick !== rightQuick) {
      return rightQuick - leftQuick;
    }

    return left.name.localeCompare(right.name);
  });
}

export function getCategorySummary(category: Category) {
  const configurableCount = category.products.filter(product => product.modifierGroups.length > 0)
    .length;
  if (configurableCount > 0) {
    return `${configurableCount} custom build${configurableCount === 1 ? "" : "s"}`;
  }
  return "Ready to order";
}

export function getCategoryMixLabel(category: Category) {
  const configurableCount = category.products.filter(product => product.modifierGroups.length > 0)
    .length;
  const quickCount = category.products.length - configurableCount;

  if (configurableCount > 0 && quickCount > 0) {
    return `${quickCount} quick / ${configurableCount} custom`;
  }
  if (configurableCount > 0) {
    return `${configurableCount} custom options`;
  }
  return `${quickCount} quick picks`;
}

export function getBasketUpsellProducts(
  categories: Category[],
  cart: CartResponse | null,
  limit = 3
) {
  const cartItemNames = new Set(
    (cart?.items ?? []).map(item => item.itemName.trim().toLowerCase())
  );

  return categories
    .flatMap(category => category.products)
    .filter(product => product.modifierGroups.length === 0)
    .filter(product => !cartItemNames.has(product.name.trim().toLowerCase()))
    .sort((left, right) => {
      const featuredDelta = Number(right.isFeatured) - Number(left.isFeatured);
      if (featuredDelta !== 0) {
        return featuredDelta;
      }

      const leftPrice = left.variants.find(variant => variant.isDefault)?.priceAmount ?? left.variants[0]?.priceAmount ?? 0;
      const rightPrice = right.variants.find(variant => variant.isDefault)?.priceAmount ?? right.variants[0]?.priceAmount ?? 0;
      return leftPrice - rightPrice;
    })
    .slice(0, limit);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value) || 0);
}
