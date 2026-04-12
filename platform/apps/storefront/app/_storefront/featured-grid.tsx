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
    <div className="featured-grid">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className="featured-card"
          onClick={item.onOpen}
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
