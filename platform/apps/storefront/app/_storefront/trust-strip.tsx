import { storefrontContent } from "./content";

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Why people order from Tuckinn Proper" role="list">
      {storefrontContent.trust.map(item => (
        <div className="trust-pill" key={item} role="listitem">
          <span className="trust-dot" aria-hidden="true" />
          <strong>{item}</strong>
        </div>
      ))}
    </section>
  );
}
