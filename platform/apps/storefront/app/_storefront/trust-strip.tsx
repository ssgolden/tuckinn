import { storefrontContent } from "./content";

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Why people order from Tuckinn Proper">
      {storefrontContent.trust.map(item => (
        <div className="trust-pill" key={item}>
          <span className="trust-dot" aria-hidden="true" />
          <strong>{item}</strong>
        </div>
      ))}
    </section>
  );
}
