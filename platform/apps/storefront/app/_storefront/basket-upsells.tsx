import { formatMoney, type Product, type ProductSelectionState } from "./catalog";

type BasketUpsellsProps = {
  body: string;
  products: Product[];
  selections: Record<string, ProductSelectionState>;
  isPendingAction: boolean;
  onAdd: (product: Product) => void;
};

export function BasketUpsells({
  body,
  products,
  selections,
  isPendingAction,
  onAdd
}: BasketUpsellsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="basket-upsells" aria-label="Basket upsell suggestions">
      <div className="basket-upsells-head">
        <h3>Add something extra</h3>
        <p>{body}</p>
      </div>
      <div className="basket-upsell-grid">
        {products.map(product => {
          const selection = selections[product.id];
          const basePrice =
            product.variants.find(variant => variant.isDefault)?.priceAmount ??
            product.variants[0]?.priceAmount ??
            0;

          return (
            <article key={product.id} className="basket-upsell-card" aria-label={product.name}>
              <div>
                <strong>{product.name}</strong>
                <p>{product.shortDescription || "A fast extra to round out lunch."}</p>
              </div>
              <div className="basket-upsell-meta">
                <span>{formatMoney(basePrice)}</span>
                <button
                  type="button"
                  className="secondary-action"
                  disabled={isPendingAction}
                  onClick={() => onAdd(product)}
                  aria-label={`Add ${product.name} to basket`}
                >
                  {isPendingAction ? "Adding..." : "Add to basket"}
                </button>
              </div>
              {selection?.notes ? <p className="basket-upsell-note">{selection.notes}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function BasketUpsellsSkeleton() {
  return (
    <section className="basket-upsells" aria-hidden="true">
      <div className="basket-upsells-head">
        <div className="skeleton skeleton-heading" style={{ width: "50%", height: 18 }} />
        <div className="skeleton skeleton-text" />
      </div>
      <div className="basket-upsell-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-card" style={{ height: 100 }} />
        ))}
      </div>
    </section>
  );
}
