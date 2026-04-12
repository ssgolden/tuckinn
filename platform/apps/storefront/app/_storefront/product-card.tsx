import type { Product, ProductSelectionState } from "./catalog";

type ProductCardProps = {
  product: Product;
  selection: ProductSelectionState;
  priceLabel: string;
  isPendingAction: boolean;
  isRecentlyAdded: boolean;
  onAdd: () => void;
  onCustomise: () => void;
};

export function ProductCard({
  product,
  selection,
  priceLabel,
  isPendingAction,
  isRecentlyAdded,
  onAdd,
  onCustomise
}: ProductCardProps) {
  const isCustom = product.modifierGroups.length > 0;
  const isFeatured = product.isFeatured;

  return (
    <article className="product-card">
      <div className="product-card-copy">
        <div className="product-card-top">
          <div>
            <div className="product-card-badges">
              <span className="item-type">{isCustom ? "Build step by step" : "Quick pick"}</span>
              {isFeatured ? <span className="product-badge product-badge-featured">Popular</span> : null}
            </div>
            <h3>{product.name}</h3>
          </div>
          <strong className="menu-row-price">{priceLabel}</strong>
        </div>
        <p>{product.shortDescription || "Prepared for a fast lunch service."}</p>
        <p className="menu-row-note">
          {isCustom
            ? "Choose customise if you want to pick fillings and sauces yourself."
            : "This item can be added to the basket straight away."}
        </p>
        {isCustom ? (
          <div className="menu-subgroups">
            {product.modifierGroups.slice(0, 4).map(group => (
              <div key={group.id} className="menu-subgroup">
                <strong>{group.name}</strong>
                <span>{group.options.slice(0, 3).map(option => option.name).join(", ")}</span>
              </div>
            ))}
          </div>
        ) : null}
        {selection.notes ? <p>{selection.notes}</p> : null}
      </div>
      <div className="menu-row-actions">
        {isCustom ? (
          <button type="button" className="secondary-action" onClick={onCustomise}>
            Customise
          </button>
        ) : null}
        <button
          type="button"
          className={isRecentlyAdded ? "primary-action primary-action-success" : "primary-action"}
          onClick={onAdd}
          disabled={isPendingAction}
        >
          {isPendingAction ? "Updating..." : isRecentlyAdded ? "Added" : "Add to basket"}
        </button>
      </div>
    </article>
  );
}
