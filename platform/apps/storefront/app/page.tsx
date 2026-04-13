import { StorefrontHomePage } from "./_storefront/client-home";

// Prevent static prerender — the storefront needs runtime API data.
export const dynamic = "force-dynamic";

export default function Page() {
  return <StorefrontHomePage />;
}