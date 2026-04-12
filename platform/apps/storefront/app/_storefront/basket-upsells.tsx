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
    <section className="basket-upsells">
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
            <article key={product.id} className="basket-upsell-card">
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
