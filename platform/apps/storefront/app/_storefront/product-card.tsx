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
    <article className="product-card" role="group" aria-label={product.name}>
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
          <button type="button" className="secondary-action" onClick={onCustomise} aria-label={`Customise ${product.name}`}>
            Customise
          </button>
        ) : null}
        <button
          type="button"
          className={isRecentlyAdded ? "primary-action primary-action-success" : "primary-action"}
          onClick={onAdd}
          disabled={isPendingAction}
          aria-label={`Add ${product.name} to basket`}
          aria-live="polite"
        >
          {isPendingAction ? "Updating..." : isRecentlyAdded ? "Added" : "Add to basket"}
        </button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="skeleton-product-card" aria-hidden="true" role="status">
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-text-short" />
        <div className="skeleton skeleton-heading" style={{ width: "40%", height: 18 }} />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text-short" style={{ width: "60%" }} />
      </div>
      <div style={{ width: 80 }}>
        <div className="skeleton" style={{ height: 44, borderRadius: 20 }} />
      </div>
    </div>
  );
}

export function ProductCardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="menu-error-card" role="alert">
      <span className="material-icons error-card-icon" aria-hidden="true">error_outline</span>
      <h2>Something went wrong</h2>
      <p>{message}</p>
      <button type="button" className="primary-action" onClick={onRetry} aria-label="Retry loading menu">
        Try again
      </button>
    </div>
  );
}
