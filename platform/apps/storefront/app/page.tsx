"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState, useTransition } from "react";
import {
  ADMIN_APP_URL,
  ApiError,
  apiFetch,
  clearStoredCartId,
  loadStoredCartId,
  loginBackOffice,
  logoutBackOfficeSession,
  restoreBackOfficeSession,
  saveStoredCartId,
  STAFF_APP_URL,
  type BackOfficeSession,
  type CartResponse,
  type PublicCatalogResponse
} from "../lib/api";

type ProductSelectionState = {
  selectedOptionIds: string[];
  notes: string;
};

type Category = PublicCatalogResponse["categories"][number];
type Product = Category["products"][number];
type ModifierGroup = Product["modifierGroups"][number];
type StorefrontView = "home" | "menu" | "builder" | "basket" | "access";
type MenuFilter = "all" | "quick" | "build" | "featured";

const MENU_FILTERS: Array<{ value: MenuFilter; label: string }> = [
  { value: "all", label: "All items" },
  { value: "quick", label: "Quick order" },
  { value: "build", label: "Custom builds" },
  { value: "featured", label: "Featured" }
];

export default function StorefrontHomePage() {
  const [catalog, setCatalog] = useState<PublicCatalogResponse | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [view, setView] = useState<StorefrontView>("home");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [builderProductId, setBuilderProductId] = useState<string | null>(null);
  const [builderStep, setBuilderStep] = useState(0);
  const [menuFilter, setMenuFilter] = useState<MenuFilter>("all");
  const [selections, setSelections] = useState<Record<string, ProductSelectionState>>({});
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    orderKind: "collect",
    specialInstructions: ""
  });
  const [backOfficeSession, setBackOfficeSession] = useState<BackOfficeSession | null>(null);
  const [authForm, setAuthForm] = useState({
    email: "admin@tuckinn.local",
    password: "ChangeMe123!"
  });
  const [authState, setAuthState] = useState<string | null>(null);
  const [authStateTone, setAuthStateTone] = useState<"success" | "error">("success");
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [checkoutState, setCheckoutState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void bootstrap();
  }, []);

  const categories = catalog?.categories ?? [];
  const activeCategory =
    categories.find(category => category.id === activeCategoryId) ?? categories[0] ?? null;
  const configurableProducts = categories.flatMap(category =>
    category.products.filter(product => product.modifierGroups.length > 0)
  );
  const builderProduct =
    configurableProducts.find(product => product.id === builderProductId) ??
    configurableProducts[0] ??
    null;
  const builderSelection = builderProduct
    ? selections[builderProduct.id] ?? {
        selectedOptionIds: getDefaultOptionIds(builderProduct),
        notes: ""
      }
    : null;
  const builderGroup =
    builderProduct?.modifierGroups[builderStep] ?? builderProduct?.modifierGroups[0] ?? null;
  const basketCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const homeCategories = categories.slice(0, 6);
  const signatureProducts = categories
    .flatMap(category =>
      category.products
        .filter(product => product.isFeatured)
        .map(product => ({ ...product, categoryName: category.name }))
    )
    .slice(0, 4);
  const visibleProducts = getFilteredProducts(activeCategory, menuFilter);

  async function bootstrap() {
    try {
      setError(null);
      const nextCatalog = await apiFetch<PublicCatalogResponse>("/catalog/public?locationCode=main");
      setCatalog(nextCatalog);
      setSelections(buildInitialSelections(nextCatalog));
      setActiveCategoryId(nextCatalog.categories[0]?.id ?? null);

      const firstBuilder = nextCatalog.categories
        .flatMap(category => category.products)
        .find(product => product.modifierGroups.length > 0);
      if (firstBuilder) {
        setBuilderProductId(firstBuilder.id);
      }

      const storedCartId = loadStoredCartId();
      if (storedCartId) {
        try {
          const existingCart = await apiFetch<CartResponse>(`/carts/${storedCartId}`);
          setCart(existingCart);
          setCartId(existingCart.id);
        } catch {
          clearStoredCartId();
        }
      }

      const restoredSession = await restoreBackOfficeSession();
      if (restoredSession) {
        setBackOfficeSession(restoredSession);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load the storefront.");
    } finally {
      setIsLoading(false);
    }
  }

  async function ensureCart() {
    if (cartId) {
      return cartId;
    }

    const createdCart = await apiFetch<CartResponse>("/carts", {
      method: "POST",
      body: JSON.stringify({ locationCode: "main" })
    });

    setCart(createdCart);
    setCartId(createdCart.id);
    saveStoredCartId(createdCart.id);
    return createdCart.id;
  }

  function openMenu(categoryId?: string) {
    setError(null);
    if (categoryId) {
      setActiveCategoryId(categoryId);
    }
    setMenuFilter("all");
    setView("menu");
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openBuilder(productId?: string) {
    setError(null);
    if (productId) {
      setBuilderProductId(productId);
    }
    setBuilderStep(0);
    setView("builder");
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openAccess() {
    setAuthState(null);
    setAuthStateTone("success");
    setError(null);
    setView("access");
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleBackOfficeLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAuthPending(true);
    setAuthState(null);
    setAuthStateTone("success");

    try {
      const session = await loginBackOffice(authForm.email, authForm.password);
      setBackOfficeSession(session);
      setAuthState("Signed in. You can now open the admin or staff backend.");
      setAuthStateTone("success");
    } catch (loginError) {
      setAuthStateTone("error");
      if (loginError instanceof ApiError) {
        setAuthState(loginError.message);
      } else {
        setAuthState(
          loginError instanceof Error ? loginError.message : "Back office sign-in failed."
        );
      }
    } finally {
      setIsAuthPending(false);
    }
  }

  async function handleBackOfficeLogout() {
    setIsAuthPending(true);
    try {
      await logoutBackOfficeSession(backOfficeSession);
      setBackOfficeSession(null);
      setAuthState("Signed out.");
      setAuthStateTone("success");
    } finally {
      setIsAuthPending(false);
    }
  }

  function openDashboard(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function toggleOption(product: Product, group: ModifierGroup, optionId: string) {
    setSelections(current => {
      const currentState = current[product.id] ?? {
        selectedOptionIds: getDefaultOptionIds(product),
        notes: ""
      };
      const groupOptionIds = group.options.map(option => option.id);
      const selectedInGroup = currentState.selectedOptionIds.filter(id =>
        groupOptionIds.includes(id)
      );
      const isSelected = selectedInGroup.includes(optionId);
      let nextIds = currentState.selectedOptionIds.filter(id => id !== optionId);

      if (!isSelected) {
        if (group.maxSelect === 1) {
          nextIds = nextIds.filter(id => !groupOptionIds.includes(id));
        } else if (selectedInGroup.length >= group.maxSelect) {
          setError(`You can only choose ${group.maxSelect} option(s) for ${group.name}.`);
          return current;
        }
        nextIds = [...nextIds, optionId];
      } else if (group.isRequired && selectedInGroup.length <= group.minSelect) {
        setError(`${group.name} requires at least ${group.minSelect} selection(s).`);
        return current;
      }

      setError(null);

      return {
        ...current,
        [product.id]: {
          ...currentState,
          selectedOptionIds: nextIds
        }
      };
    });
  }

  function updateNotes(productId: string, notes: string) {
    const product = categories
      .flatMap(category => category.products)
      .find(item => item.id === productId);

    setSelections(current => ({
      ...current,
      [productId]: {
        selectedOptionIds:
          current[productId]?.selectedOptionIds ??
          (product ? getDefaultOptionIds(product) : []),
        notes
      }
    }));
  }

  function goBuilderNext() {
    if (!builderProduct || !builderGroup || !builderSelection) {
      return;
    }

    if (getSelectedCount(builderGroup, builderSelection.selectedOptionIds) < builderGroup.minSelect) {
      setError(`${builderGroup.name} requires at least ${builderGroup.minSelect} selection(s).`);
      return;
    }

    setError(null);
    setBuilderStep(current => Math.min(current + 1, builderProduct.modifierGroups.length - 1));
  }

  async function addProductToCart(product: Product) {
    startTransition(async () => {
      try {
        setError(null);
        setCheckoutState(null);
        const selection = selections[product.id] ?? {
          selectedOptionIds: getDefaultOptionIds(product),
          notes: ""
        };
        const missingGroups = getMissingGroups(product, selection);
        if (missingGroups.length > 0) {
          setError(`Complete ${missingGroups.join(", ")} before adding this item.`);
          openBuilder(product.id);
          return;
        }

        const activeCartId = await ensureCart();
        const defaultVariant = product.variants.find(variant => variant.isDefault) ?? product.variants[0];
        const updatedCart = await apiFetch<CartResponse>(`/carts/${activeCartId}/items`, {
          method: "POST",
          body: JSON.stringify({
            productSlug: product.slug,
            variantId: defaultVariant?.id,
            quantity: 1,
            notes: selection.notes || undefined,
            selectedOptionIds: selection.selectedOptionIds
          })
        });

        setCart(updatedCart);
        setView("basket");
      } catch (cartError) {
        setError(cartError instanceof Error ? cartError.message : "Failed to add item.");
      }
    });
  }

  async function removeCartItem(itemId: string) {
    if (!cartId) {
      return;
    }

    startTransition(async () => {
      try {
        const updatedCart = await apiFetch<CartResponse>(`/carts/${cartId}/items/${itemId}`, {
          method: "DELETE"
        });
        setCart(updatedCart);
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : "Failed to remove item.");
      }
    });
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cartId) {
      setError("Create a basket before starting checkout.");
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const result = await apiFetch<{
          order: { orderNumber: string };
          payment: { provider: string; status: string };
        }>("/checkout/start", {
          method: "POST",
          body: JSON.stringify({
            cartId,
            idempotencyKey: crypto.randomUUID(),
            orderKind: checkoutForm.orderKind,
            customerName: checkoutForm.customerName,
            customerEmail: checkoutForm.customerEmail || undefined,
            customerPhone: checkoutForm.customerPhone || undefined,
            specialInstructions: checkoutForm.specialInstructions || undefined
          })
        });

        setCheckoutState(
          `Order ${result.order.orderNumber} is ${result.payment.status} via ${result.payment.provider}.`
        );
        setView("basket");
      } catch (checkoutError) {
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "Checkout could not be started."
        );
      }
    });
  }

  if (isLoading) {
    return (
      <main className="storefront-shell">
        <section className="loading-screen">
          <Image src="/logo.jpg" alt="Tuckinn Proper" width={220} height={110} className="brand-logo" priority />
          <div>
            <p className="section-kicker">Loading storefront</p>
            <h1>Restoring the full menu and sandwich builder.</h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="storefront-shell">
      <header className="topbar">
        <button type="button" className="topbar-button" onClick={() => setIsDrawerOpen(true)} aria-label="Open menu navigation">
          Menu
        </button>
        <button type="button" className="brand-lockup" onClick={() => setView("home")} aria-label="Go to home">
          <Image src="/logo.jpg" alt="Tuckinn Proper" width={180} height={90} className="brand-logo" priority />
        </button>
        <button type="button" className="topbar-button topbar-button-strong" onClick={() => setView("basket")}>
          Basket {basketCount}
        </button>
      </header>

      <div
        className={isDrawerOpen ? "drawer-overlay drawer-overlay-open" : "drawer-overlay"}
        onClick={() => setIsDrawerOpen(false)}
      />
      <aside className={isDrawerOpen ? "side-drawer side-drawer-open" : "side-drawer"} aria-label="Menu categories">
        <div className="drawer-head">
          <div>
            <p className="section-kicker">Platinum menu</p>
            <h2>Browse sections</h2>
          </div>
          <button type="button" className="drawer-close" onClick={() => setIsDrawerOpen(false)} aria-label="Close navigation">
            Close
          </button>
        </div>
        <div className="drawer-list">
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              className="drawer-item"
              onClick={() => openMenu(category.id)}
            >
              <div>
                <strong>{category.name}</strong>
                <span>{category.description || "Browse this full section."}</span>
              </div>
              <em>{category.products.length}</em>
            </button>
          ))}
          <button type="button" className="drawer-item drawer-item-strong" onClick={() => openBuilder()}>
            <div>
              <strong>Build Proper Sandwich</strong>
              <span>Guided custom builder with required steps.</span>
            </div>
            <em>Go</em>
          </button>
          <button type="button" className="drawer-item" onClick={openAccess}>
            <div>
              <strong>Back Office Access</strong>
              <span>{backOfficeSession ? "Session active for admin and staff tools." : "Sign in to the backend from the website."}</span>
            </div>
            <em>{backOfficeSession ? "Live" : "Login"}</em>
          </button>
        </div>
      </aside>

      {error ? <p className="inline-message inline-message-error">{error}</p> : null}
      {checkoutState ? <p className="inline-message inline-message-success">{checkoutState}</p> : null}

      {view === "home" ? (
        <section className="home-view">
          <section className="hero">
            <div className="hero-copy">
              <p className="section-kicker">Tuckinn Proper</p>
              <h1>Order Proper</h1>
              <p className="hero-lead">Sandwiches, meal deals, drinks, and custom builds without the clutter.</p>
              <div className="hero-actions">
                <button type="button" className="primary-action" onClick={() => openBuilder()}>
                  Start Sandwich
                </button>
                <button type="button" className="secondary-action" onClick={() => openMenu()}>
                  Open Full Menu
                </button>
              </div>
              <div className="hero-metrics">
                <div className="metric-card">
                  <span>Categories</span>
                  <strong>{categories.length}</strong>
                </div>
                <div className="metric-card">
                  <span>Custom builds</span>
                  <strong>{configurableProducts.length}</strong>
                </div>
                <div className="metric-card">
                  <span>Basket total</span>
                  <strong>{formatMoney(cart?.totalAmount ?? 0)}</strong>
                </div>
              </div>
            </div>
            <div className="hero-brand">
              <div className="hero-brand-badge">
                <span className="section-kicker">Quick start</span>
                <div className="quick-start-list">
                  <button
                    type="button"
                    className="quick-start-item"
                    onClick={() => openMenu(categories.find(category => category.name === "Meal Deals")?.id)}
                  >
                    <strong>Meal Deals</strong>
                    <span>Fastest route into the menu</span>
                  </button>
                  <button
                    type="button"
                    className="quick-start-item"
                    onClick={() => openMenu(categories.find(category => category.name === "Originals")?.id)}
                  >
                    <strong>Originals</strong>
                    <span>House sandwiches and signature builds</span>
                  </button>
                  <button type="button" className="quick-start-item" onClick={() => setView("basket")}>
                    <strong>Basket</strong>
                    <span>{basketCount ? `${basketCount} item(s) ready to review` : "Nothing added yet"}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="content-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Start here</p>
                <h2>Choose your route</h2>
              </div>
            </div>
            <div className="route-grid">
              <button type="button" className="route-card route-card-primary" onClick={() => openBuilder()}>
                <span className="route-tag">Custom build</span>
                <strong>Build Your Sandwich</strong>
                <p>Step through bread, protein, veg, cheese, sauce, and notes.</p>
              </button>
              <button
                type="button"
                className="route-card"
                onClick={() => openMenu(categories.find(category => category.name === "Meal Deals")?.id)}
              >
                <span className="route-tag">Popular bundles</span>
                <strong>Meal Deals</strong>
                <p>Jump into the fastest-value section instead of browsing everything.</p>
              </button>
              <button type="button" className="route-card" onClick={openAccess}>
                <span className="route-tag">Back office</span>
                <strong>Backend Login</strong>
                <p>{backOfficeSession ? "Session is active for admin and staff dashboards." : "Sign in to admin and staff tools from the storefront."}</p>
              </button>
            </div>
          </section>

          <section className="content-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Menu overview</p>
                <h2>Featured categories</h2>
              </div>
              <button type="button" className="text-link" onClick={() => setIsDrawerOpen(true)}>
                Open all sections
              </button>
            </div>
            <div className="category-grid">
              {homeCategories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  className="category-card"
                  onClick={() => openMenu(category.id)}
                >
                  <div className="category-card-top">
                    <span>{category.name}</span>
                    <em>{category.products.length} items</em>
                  </div>
                  <strong>{category.description || "Fast section access from the live menu."}</strong>
                  <div className="category-card-meta">
                    <span>{getCategoryMixLabel(category)}</span>
                    <span>{getCategorySummary(category)}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="content-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Staff picks</p>
                <h2>Signature menu items</h2>
              </div>
            </div>
            <div className="signature-list">
              {signatureProducts.map(product => {
                const selection = selections[product.id] ?? {
                  selectedOptionIds: getDefaultOptionIds(product),
                  notes: ""
                };
                return (
                  <article key={product.id} className="signature-card">
                    <div className="signature-copy">
                      <span className="signature-category">{product.categoryName}</span>
                      <h3>{product.name}</h3>
                      <p>{product.shortDescription || "Prepared for a fast lunch service."}</p>
                    </div>
                    <div className="signature-meta">
                      <span className="signature-price-label">
                        {product.modifierGroups.length ? "Build available" : "Quick add"}
                      </span>
                      <strong>{formatMoney(getProductPrice(product, selection))}</strong>
                      <button
                        type="button"
                        className={product.modifierGroups.length ? "secondary-action" : "primary-action"}
                        onClick={() =>
                          product.modifierGroups.length
                            ? openBuilder(product.id)
                            : void addProductToCart(product)
                        }
                      >
                        {product.modifierGroups.length ? "Customize" : "Add"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      ) : null}

      {view === "menu" ? (
        <section className="menu-view">
          <section className="menu-hero">
            <div>
              <p className="section-kicker">Menu category</p>
              <h1>{activeCategory?.name ?? "Menu"}</h1>
              <p>{activeCategory?.description ?? "Browse the live menu from the platform catalog."}</p>
            </div>
            <button type="button" className="secondary-action" onClick={() => setIsDrawerOpen(true)}>
              All sections
            </button>
          </section>

          <section className="content-panel">
            <div className="category-strip">
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  className={activeCategory?.id === category.id ? "nav-pill nav-pill-active" : "nav-pill"}
                  onClick={() => openMenu(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="submenu-strip">
              {MENU_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  className={menuFilter === filter.value ? "submenu-pill submenu-pill-active" : "submenu-pill"}
                  onClick={() => setMenuFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          <section className="menu-list">
            {visibleProducts.map(product => {
              const selection = selections[product.id] ?? {
                selectedOptionIds: getDefaultOptionIds(product),
                notes: ""
              };
              return (
                <article key={product.id} className="menu-row">
                  <div className="menu-row-copy">
                    <div className="menu-row-top">
                      <div>
                        <span className="item-type">
                          {product.modifierGroups.length ? "Custom build" : "Quick order"}
                        </span>
                        <h3>{product.name}</h3>
                      </div>
                      <strong>{formatMoney(getProductPrice(product, selection))}</strong>
                    </div>
                    <p>{product.shortDescription || "Prepared for a fast lunch service."}</p>
                    {product.modifierGroups.length ? (
                      <div className="menu-subgroups">
                        {product.modifierGroups.slice(0, 4).map(group => (
                          <div key={group.id} className="menu-subgroup">
                            <strong>{group.name}</strong>
                            <span>{group.options.slice(0, 3).map(option => option.name).join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="menu-row-actions">
                    {product.modifierGroups.length ? (
                      <button type="button" className="secondary-action" onClick={() => openBuilder(product.id)}>
                        Customize
                      </button>
                    ) : null}
                    <button type="button" className="primary-action" onClick={() => void addProductToCart(product)} disabled={isPending}>
                      {isPending ? "Updating..." : "Add to order"}
                    </button>
                  </div>
                </article>
              );
            })}
            {visibleProducts.length === 0 ? (
              <div className="empty-panel">
                <strong>No items match this submenu yet.</strong>
                <p>Switch to another submenu or choose a different category.</p>
              </div>
            ) : null}
          </section>
        </section>
      ) : null}

      {view === "builder" && builderProduct && builderSelection ? (
        <section className="builder-view">
          <section className="builder-hero">
            <div>
              <p className="section-kicker">Build your sandwich</p>
              <h1>{builderProduct.name}</h1>
              <p>{builderProduct.shortDescription}</p>
            </div>
            <strong className="builder-price">{formatMoney(getProductPrice(builderProduct, builderSelection))}</strong>
          </section>

          <div className="builder-layout">
            <section className="content-panel">
              <div className="builder-switches">
                {configurableProducts.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    className={builderProduct.id === product.id ? "nav-pill nav-pill-active" : "nav-pill"}
                    onClick={() => {
                      setBuilderProductId(product.id);
                      setBuilderStep(0);
                      setError(null);
                    }}
                  >
                    {product.name}
                  </button>
                ))}
              </div>

              <div className="progress-strip">
                {builderProduct.modifierGroups.map((group, index) => {
                  const complete = getSelectedCount(group, builderSelection.selectedOptionIds) >= group.minSelect;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      className={
                        index === builderStep
                          ? "progress-pill progress-pill-current"
                          : complete
                            ? "progress-pill progress-pill-complete"
                            : "progress-pill"
                      }
                      onClick={() => setBuilderStep(index)}
                    >
                      {index + 1}. {group.name}
                    </button>
                  );
                })}
              </div>

              {builderGroup ? (
                <div className="builder-stage">
                  <div className="panel-head">
                    <div>
                      <p className="section-kicker">Step {builderStep + 1}</p>
                      <h2>{builderGroup.name}</h2>
                    </div>
                    <span className="selection-rule">
                      {builderGroup.minSelect} to {builderGroup.maxSelect} choice(s)
                    </span>
                  </div>
                  <p className="stage-copy">{builderGroup.description || "Choose from the available options below."}</p>
                  <div className="builder-options">
                    {builderGroup.options.map(option => {
                      const selected = builderSelection.selectedOptionIds.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={selected ? "option-card option-card-selected" : "option-card"}
                          onClick={() => toggleOption(builderProduct, builderGroup, option.id)}
                        >
                          <strong>{option.name}</strong>
                          <span>
                            {option.priceDeltaAmount > 0 ? `+ ${formatMoney(option.priceDeltaAmount)}` : "Included"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <label className="field">
                    Sandwich notes
                    <textarea
                      className="text-area"
                      value={builderSelection.notes}
                      onChange={event => updateNotes(builderProduct.id, event.target.value)}
                      placeholder="Allergies, toast level, or extra build notes"
                    />
                  </label>
                  <div className="builder-actions">
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => setBuilderStep(current => Math.max(current - 1, 0))}
                      disabled={builderStep === 0}
                    >
                      Previous
                    </button>
                    {builderStep < builderProduct.modifierGroups.length - 1 ? (
                      <button type="button" className="primary-action" onClick={goBuilderNext}>
                        Next step
                      </button>
                    ) : (
                      <button type="button" className="primary-action" onClick={() => void addProductToCart(builderProduct)} disabled={isPending}>
                        {isPending ? "Adding..." : "Add sandwich"}
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="content-panel builder-summary">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Current build</p>
                  <h2>Selection summary</h2>
                </div>
              </div>
              <div className="summary-list">
                {builderProduct.modifierGroups.map(group => (
                  <div key={group.id} className="summary-card">
                    <strong>{group.name}</strong>
                    <span>{getSelectionLabel(group, builderSelection.selectedOptionIds)}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {view === "basket" ? (
        <section className="basket-view">
          <div className="basket-layout">
            <section className="content-panel">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Your order</p>
                  <h2>Basket</h2>
                </div>
                <strong>{basketCount} item(s)</strong>
              </div>
              <div className="basket-items">
                {cart?.items.length ? (
                  cart.items.map(item => (
                    <article key={item.id} className="basket-row">
                      <div>
                        <strong>{item.quantity}x {item.itemName}</strong>
                        {item.modifiers.length ? (
                          <p>
                            {item.modifiers
                              .map(modifier => `${modifier.modifierGroupName}: ${modifier.modifierOptionName}`)
                              .join(" - ")}
                          </p>
                        ) : null}
                        {item.notes ? <p>{item.notes}</p> : null}
                      </div>
                      <div className="basket-row-meta">
                        <strong>{formatMoney(item.lineTotalAmount)}</strong>
                        <button type="button" className="text-link" onClick={() => void removeCartItem(item.id)}>
                          Remove
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-panel">
                    <strong>Your basket is empty.</strong>
                    <p>Open the menu or start a sandwich build to begin the order.</p>
                  </div>
                )}
              </div>
              <div className="basket-totals">
                <div><span>Subtotal</span><strong>{formatMoney(cart?.subtotalAmount ?? 0)}</strong></div>
                <div><span>Total</span><strong>{formatMoney(cart?.totalAmount ?? 0)}</strong></div>
              </div>
            </section>

            <section className="content-panel">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Checkout</p>
                  <h2>Customer details</h2>
                </div>
              </div>
              <form className="checkout-form" onSubmit={handleCheckout}>
                <label className="field">
                  Full name
                  <input className="text-input" value={checkoutForm.customerName} onChange={event => setCheckoutForm(current => ({ ...current, customerName: event.target.value }))} required />
                </label>
                <label className="field">
                  Email
                  <input className="text-input" type="email" value={checkoutForm.customerEmail} onChange={event => setCheckoutForm(current => ({ ...current, customerEmail: event.target.value }))} />
                </label>
                <label className="field">
                  Phone
                  <input className="text-input" value={checkoutForm.customerPhone} onChange={event => setCheckoutForm(current => ({ ...current, customerPhone: event.target.value }))} />
                </label>
                <label className="field">
                  Order type
                  <select className="select-input" value={checkoutForm.orderKind} onChange={event => setCheckoutForm(current => ({ ...current, orderKind: event.target.value }))}>
                    <option value="collect">Collect</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </label>
                <label className="field">
                  Special instructions
                  <textarea className="text-area" value={checkoutForm.specialInstructions} onChange={event => setCheckoutForm(current => ({ ...current, specialInstructions: event.target.value }))} placeholder="Pickup timing, allergies, or delivery notes" />
                </label>
                <button type="submit" className="primary-action" disabled={isPending || !cart?.items.length}>
                  {isPending ? "Starting checkout..." : "Start checkout"}
                </button>
                <p className="checkout-note">
                  The backend creates the order and payment intent first. Live card collection
                  comes online once real Stripe keys replace the placeholder values.
                </p>
              </form>
            </section>
          </div>
        </section>
      ) : null}

      {view === "access" ? (
        <section className="access-view">
          <section className="access-hero">
            <div>
              <p className="section-kicker">Back office access</p>
              <h1>Sign in to the backend from the website.</h1>
              <p className="hero-lead">
                Use your staff or admin credentials once here, then launch the admin and staff dashboards
                with the same session.
              </p>
            </div>
          </section>

          <div className="access-layout">
            <section className="content-panel">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Authentication</p>
                  <h2>{backOfficeSession ? "Session active" : "Sign in"}</h2>
                </div>
              </div>

              {backOfficeSession ? (
                <div className="access-card">
                  <div className="access-session-head">
                    <div>
                      <strong>{backOfficeSession.user.firstName} {backOfficeSession.user.lastName}</strong>
                      <p>{backOfficeSession.user.email}</p>
                    </div>
                    <span className="session-pill">Connected</span>
                  </div>
                  <div className="access-meta">
                    <div>
                      <span>Roles</span>
                      <strong>{backOfficeSession.user.roles.length ? backOfficeSession.user.roles.join(", ") : "staff"}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{backOfficeSession.user.status ?? "active"}</strong>
                    </div>
                  </div>
                  <div className="access-actions">
                    <button type="button" className="primary-action" onClick={() => openDashboard(ADMIN_APP_URL)}>
                      Open Admin
                    </button>
                    <button type="button" className="secondary-action" onClick={() => openDashboard(STAFF_APP_URL)}>
                      Open Staff
                    </button>
                    <button type="button" className="secondary-action" onClick={() => openDashboard("http://localhost:3200/api")}>
                      Open API
                    </button>
                  </div>
                  <button type="button" className="text-link text-link-inline" onClick={() => void handleBackOfficeLogout()}>
                    {isAuthPending ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              ) : (
                <form className="checkout-form" onSubmit={handleBackOfficeLogin}>
                  <label className="field">
                    Email
                    <input
                      className="text-input"
                      type="email"
                      value={authForm.email}
                      onChange={event => setAuthForm(current => ({ ...current, email: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="field">
                    Password
                    <input
                      className="text-input"
                      type="password"
                      value={authForm.password}
                      onChange={event => setAuthForm(current => ({ ...current, password: event.target.value }))}
                      required
                    />
                  </label>
                  <button type="submit" className="primary-action" disabled={isAuthPending}>
                    {isAuthPending ? "Signing in..." : "Sign in to backend"}
                  </button>
                  <p className="checkout-note">
                    This uses the existing staff/admin backend login and shares the session with the admin and staff apps.
                  </p>
                </form>
              )}

              {authState ? (
                <p className={authStateTone === "error" ? "inline-message inline-message-error" : "inline-message inline-message-success"}>
                  {authState}
                </p>
              ) : null}
            </section>

            <aside className="content-panel access-side">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Launch points</p>
                  <h2>Where this signs you in</h2>
                </div>
              </div>
              <div className="access-link-list">
                <div className="access-link-card">
                  <strong>Admin dashboard</strong>
                  <span>{ADMIN_APP_URL}</span>
                </div>
                <div className="access-link-card">
                  <strong>Staff console</strong>
                  <span>{STAFF_APP_URL}</span>
                </div>
                <div className="access-link-card">
                  <strong>API root</strong>
                  <span>http://localhost:3200/api</span>
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      <nav className="bottom-nav" aria-label="Primary">
        <button type="button" className={view === "home" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} onClick={() => setView("home")}>
          Home
        </button>
        <button type="button" className={view === "menu" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} onClick={() => openMenu()}>
          Menu
        </button>
        <button type="button" className={view === "builder" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} onClick={() => openBuilder()}>
          Builder
        </button>
        <button type="button" className={view === "basket" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} onClick={() => setView("basket")}>
          Basket
        </button>
      </nav>
    </main>
  );
}

function buildInitialSelections(catalog: PublicCatalogResponse) {
  return Object.fromEntries(
    catalog.categories.flatMap(category =>
      category.products.map(product => [
        product.id,
        { selectedOptionIds: getDefaultOptionIds(product), notes: "" }
      ])
    )
  ) as Record<string, ProductSelectionState>;
}

function getDefaultOptionIds(product: Product) {
  return product.modifierGroups.flatMap(group => {
    const defaults = group.options.filter(option => option.isDefault).map(option => option.id);
    if (defaults.length > 0) {
      return defaults.slice(0, group.maxSelect);
    }
    if (group.isRequired && group.options[0]) {
      return [group.options[0].id];
    }
    return [];
  });
}

function getSelectedCount(group: ModifierGroup, selectedOptionIds: string[]) {
  const groupIds = group.options.map(option => option.id);
  return selectedOptionIds.filter(id => groupIds.includes(id)).length;
}

function getMissingGroups(product: Product, selection: ProductSelectionState) {
  return product.modifierGroups
    .filter(group => getSelectedCount(group, selection.selectedOptionIds) < group.minSelect)
    .map(group => group.name);
}

function getSelectionLabel(group: ModifierGroup, selectedOptionIds: string[]) {
  const labels = group.options
    .filter(option => selectedOptionIds.includes(option.id))
    .map(option => option.name);
  if (labels.length === 0) {
    return group.isRequired ? "Required selection pending" : "No selection";
  }
  return labels.join(", ");
}

function getProductPrice(product: Product, selection: ProductSelectionState) {
  const basePrice =
    product.variants.find(variant => variant.isDefault)?.priceAmount ??
    product.variants[0]?.priceAmount ??
    0;
  const premium = product.modifierGroups
    .flatMap(group => group.options)
    .filter(option => selection.selectedOptionIds.includes(option.id))
    .reduce((sum, option) => sum + option.priceDeltaAmount, 0);
  return basePrice + premium;
}

function getFilteredProducts(category: Category | null, filter: MenuFilter) {
  if (!category) {
    return [];
  }

  switch (filter) {
    case "quick":
      return category.products.filter(product => product.modifierGroups.length === 0);
    case "build":
      return category.products.filter(product => product.modifierGroups.length > 0);
    case "featured":
      return category.products.filter(product => product.isFeatured);
    default:
      return category.products;
  }
}

function getCategorySummary(category: Category) {
  const configurableCount = category.products.filter(product => product.modifierGroups.length > 0).length;
  if (configurableCount > 0) {
    return `${configurableCount} custom build${configurableCount === 1 ? "" : "s"}`;
  }
  return "Ready to order";
}

function getCategoryMixLabel(category: Category) {
  const configurableCount = category.products.filter(product => product.modifierGroups.length > 0).length;
  const quickCount = category.products.length - configurableCount;

  if (configurableCount > 0 && quickCount > 0) {
    return `${quickCount} quick / ${configurableCount} custom`;
  }
  if (configurableCount > 0) {
    return `${configurableCount} custom options`;
  }
  return `${quickCount} quick picks`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value) || 0);
}
