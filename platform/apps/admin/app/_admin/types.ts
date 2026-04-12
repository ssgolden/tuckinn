export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  imageUrl?: string | null;
  imageAltText?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  status?: "draft" | "active" | "archived";
  category?: { id: string; name: string } | null;
  variants: Array<{ id: string; name: string; priceAmount: number | string; sku?: string | null }>;
  modifierGroups?: Array<{
    modifierGroup: {
      id: string;
      name: string;
      options: Array<{ id: string; name: string }>;
    };
  }>;
};

export type ModifierGroup = {
  id: string;
  name: string;
  description?: string | null;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
  isRequired?: boolean;
  options: Array<{
    id: string;
    name: string;
    description?: string | null;
    priceDeltaAmount: number | string;
    sortOrder?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }>;
  products: Array<{ product: { id: string; slug: string; name: string } }>;
};

export type DashboardState = {
  categories: Category[];
  products: Product[];
  modifierGroups: ModifierGroup[];
};

export const INITIAL_STATE: DashboardState = {
  categories: [],
  products: [],
  modifierGroups: []
};
