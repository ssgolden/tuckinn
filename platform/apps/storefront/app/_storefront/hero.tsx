import { BuilderPreview } from "./builder-preview";
import { storefrontContent } from "./content";

type StorefrontHeroProps = {
  basketCount: number;
  brandName: string;
  onBrowseFavourites: () => void;
  onStartBuilding: () => void;
};

export function StorefrontHero({
  basketCount,
  brandName,
  onBrowseFavourites,
  onStartBuilding
}: StorefrontHeroProps) {
  return (
    <section className="hero" aria-label={`${brandName} sandwich builder`}>
      <div className="hero-content">
        <p className="section-kicker">{storefrontContent.hero.eyebrow}</p>
        <h1>{storefrontContent.hero.title}</h1>
        <p className="hero-lead">{storefrontContent.hero.body}</p>
        <div className="hero-chip-row" aria-label="Ordering highlights">
          {storefrontContent.hero.chips.map(chip => (
            <span className="hero-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
        <div className="hero-action-row" role="group" aria-label="Order actions">
          <button type="button" className="primary-action hero-primary-action" onClick={onStartBuilding} aria-label="Start building your sandwich">
            Start Building
          </button>
          <button type="button" className="secondary-action hero-secondary-action" onClick={onBrowseFavourites} aria-label="Browse menu favourites">
            Browse Favourites
          </button>
        </div>
        <div className="order-steps" role="list" aria-label="How to order">
          {storefrontContent.orderSteps.map(step => (
            <div className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-brand">
        <BuilderPreview basketCount={basketCount} onStartBuilding={onStartBuilding} />
      </div>
    </section>
  );
}
