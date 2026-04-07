import { headers } from "next/headers";

type ReviewLink = {
  label: string;
  href: string;
  description: string;
};

function isLocalHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export default async function ReviewPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:4000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (isLocalHost(host) ? "http" : "https");

  const storefrontUrl = `${protocol}://${host}`;
  const adminUrl = isLocalHost(host) ? "http://localhost:3101" : `${protocol}://admin.${host}`;
  const staffUrl = isLocalHost(host) ? "http://localhost:3102" : `${protocol}://staff.${host}`;
  const apiUrl = isLocalHost(host) ? "http://localhost:3200/api" : `${protocol}://api.${host}/api`;

  const links: ReviewLink[] = [
    {
      label: "Storefront",
      href: storefrontUrl,
      description: "Customer-facing frontend for browsing menus, building orders, and checkout flow."
    },
    {
      label: "Admin",
      href: adminUrl,
      description: "Back-office catalog, modifiers, and operational admin review."
    },
    {
      label: "Staff",
      href: staffUrl,
      description: "Kitchen and fulfillment board for live order handling and status updates."
    },
    {
      label: "API",
      href: apiUrl,
      description: "Backend entrypoint for health, auth, catalog, carts, checkout, and order APIs."
    }
  ];

  return (
    <main className="review-shell">
      <section className="review-hero">
        <div className="review-eyebrow">Tuckinn Review Access</div>
        <h1>One link for full platform review.</h1>
        <p>
          Share this page with your team so they can open the live storefront, admin, staff,
          and backend endpoints from one place.
        </p>
        <div className="review-url-box">
          <span>Share URL</span>
          <strong>{`${storefrontUrl}/review`}</strong>
        </div>
      </section>

      <section className="review-grid">
        {links.map(link => (
          <article className="review-card" key={link.label}>
            <div>
              <span className="review-card-tag">{link.label}</span>
              <h2>{link.label}</h2>
              <p>{link.description}</p>
            </div>
            <a className="review-card-link" href={link.href} target="_blank" rel="noreferrer">
              Open {link.label}
            </a>
          </article>
        ))}
      </section>

      <section className="review-notes">
        <div className="review-note">
          <strong>Admin and staff credentials are separate.</strong>
          <p>Keep them off this page. Share them directly with your team if they need access.</p>
        </div>
        <div className="review-note">
          <strong>Backend is reviewable in browser.</strong>
          <p>
            Start with the API root or health route, then use your API client for protected
            endpoints.
          </p>
        </div>
      </section>
    </main>
  );
}
