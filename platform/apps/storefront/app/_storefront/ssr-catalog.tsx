import { fetchCatalog } from "../../lib/catalog-data";

export async function SsrCatalog() {
  const categories = await fetchCatalog();
  if (categories.length === 0) return null;

  return (
    <div style={{ display: "none" }} aria-hidden="true" data-seo="catalog">
      <h1>Tuckinn Proper Menu</h1>
      {categories.map(cat => (
        <section key={cat.id}>
          <h2>{cat.name}</h2>
          <ul>
            {cat.products.map(p => (
              <li key={p.id}>{p.name}{p.shortDescription ? " — " + p.shortDescription : ""}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
