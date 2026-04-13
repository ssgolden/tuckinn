type FeaturedItem = {
  id: string;
  categoryName: string;
  productName: string;
  description: string;
  price: string;
  highlight: string;
  onOpen: () => void;
};

type FeaturedGridProps = {
  items: FeaturedItem[];
};

export function FeaturedGrid({ items }: FeaturedGridProps) {
  return (
    <div className="featured-grid" role="list" aria-label="Featured items">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className="featured-card"
          onClick={item.onOpen}
          aria-label={`${item.productName} - ${item.price}, ${item.highlight}`}
        >
          <span className="featured-card-kicker">{item.categoryName}</span>
          <strong>{item.productName}</strong>
          <p>{item.description}</p>
          <div className="featured-card-footer">
            <span>{item.price}</span>
            <em>{item.highlight}</em>
          </div>
        </button>
      ))}
    </div>
  );
}

export function FeaturedGridSkeleton() {
  return (
    <div className="featured-grid" aria-hidden="true">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-card" style={{ height: 160 }} />
      ))}
    </div>
  );
}
