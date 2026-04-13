type MenuRailProps = {
  categories: Array<{ id: string; name: string }>;
  activeCategoryId: string | null;
  onSelect: (id: string) => void;
};

export function MenuRail({ categories, activeCategoryId, onSelect }: MenuRailProps) {
  return (
    <div className="menu-rail" role="tablist" aria-label="Menu categories">
      {categories.map(category => (
        <button
          key={category.id}
          type="button"
          role="tab"
          aria-selected={activeCategoryId === category.id}
          className={activeCategoryId === category.id ? "nav-pill nav-pill-active" : "nav-pill"}
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
