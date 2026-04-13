import { apiFetch, type PublicCatalogResponse } from "./api";

export type CatalogProduct = PublicCatalogResponse["categories"][number]["products"][number];

export type CatalogCategory = PublicCatalogResponse["categories"][number];

export async function fetchCatalog(): Promise<CatalogCategory[]> {
  const response = await apiFetch<PublicCatalogResponse>(
    "/catalog/public?locationCode=main"
  );
  return response.categories;
}