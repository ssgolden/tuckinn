import { fetchCatalog } from "../../lib/catalog-data";

export async function MenuJsonLd() {
  const categories = await fetchCatalog();
  if (categories.length === 0) return null;

  const menu = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Tuckinn Proper Menu",
    hasMenuSection: categories.map(cat => ({
      "@type": "MenuSection",
      name: cat.name,
      hasMenuItem: cat.products.map(p => ({
        "@type": "MenuItem",
        name: p.name,
        description: p.shortDescription || undefined
      }))
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(menu) }}
    />
  );
}
