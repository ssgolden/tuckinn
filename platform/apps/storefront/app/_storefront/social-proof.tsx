type SocialProofItem = {
  eyebrow: string;
  title: string;
  body: string;
};

type SocialProofProps = {
  items: readonly SocialProofItem[];
};

export function SocialProof({ items }: SocialProofProps) {
  return (
    <section className="social-proof" aria-label="Storefront trust signals">
      <div className="social-proof-head">
        <p className="section-kicker">Great food, great mood</p>
        <h2>Built for proper lunch orders</h2>
        <p>
          Choose a favourite, build your own sandwich, and keep the order moving without menu noise.
        </p>
      </div>
      <div className="social-proof-grid" role="list">
        {items.map(item => (
          <article className="social-proof-card" key={item.title} role="listitem">
            <span className="social-proof-kicker">{item.eyebrow}</span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
