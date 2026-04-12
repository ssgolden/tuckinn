import { storefrontContent, type StorefrontRouteAction } from "./content";

type OrderPathsProps = {
  onRouteSelect: (action: StorefrontRouteAction) => void;
};

export function OrderPaths({ onRouteSelect }: OrderPathsProps) {
  return (
    <div className="order-path-grid">
      {storefrontContent.routes.map(route => (
        <button
          key={route.title}
          type="button"
          className={route.className
            .split(" ")
            .map(className => className.replace(/^route-card/, "order-path-card"))
            .join(" ")}
          onClick={() => onRouteSelect(route.action)}
        >
          <span className="route-tag">{route.tag}</span>
          <strong>{route.title}</strong>
          <p>{route.body}</p>
        </button>
      ))}
    </div>
  );
}
