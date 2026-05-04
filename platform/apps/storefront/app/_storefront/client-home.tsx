"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState, useTransition, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  buildInitialSelections,
  formatMoney,
  getBasketUpsellProducts,
  getCategoryMixLabel,
  getCategorySummary,
  getDefaultOptionIds,
  getMerchandisedProducts,
  getMissingGroups,
  getProductPrice,
  getSelectedCount,
  getSelectionLabel,
  MENU_FILTERS,
  type Category,
  type MenuFilter,
  type ModifierGroup,
  type Product,
  type ProductSelectionState,
  type StorefrontView
} from "./catalog";
import { CategoryStory } from "./category-story";
import { BasketUpsells } from "./basket-upsells";
import { BuilderGuide } from "./builder-guide";
import { storefrontContent, type StorefrontRouteAction } from "./content";
import { FeaturedGrid } from "./featured-grid";
import { StorefrontHero } from "./hero";
import { MenuRail } from "./menu-rail";
import { OrderPaths } from "./order-paths";
import { ProductCard } from "./product-card";
import { SectionShell } from "./section-shell";
import { SocialProof } from "./social-proof";
import { TrustStrip } from "./trust-strip";
import {
  ADMIN_APP_URL,
  API_APP_URL,
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
  type DiningTableResponse,
  type PublicCatalogResponse
} from "../../lib/api";

const BRAND_NAME = "Tuckinn Proper";
const BRAND_TAGLINE = "The best thing since sliced bread";

export function StorefrontHomePage() {
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
    deliveryAddressLine1: "",
    deliveryAddressLine2: "",
    deliveryCity: "",
    deliveryPostcode: "",
    specialInstructions: ""
  });
  const [backOfficeSession, setBackOfficeSession] = useState<BackOfficeSession | null>(null);
  const [authForm, setAuthForm] = useState({
    email: "",
    password: ""
  });
  const [authState, setAuthState] = useState<string | null>(null);
  const [authStateTone, setAuthStateTone] = useState<"success" | "error">("success");
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [checkoutState, setCheckoutState] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<"idle" | "paying" | "confirmed" | "failed">("idle");
  const [pendingPayment, setPendingPayment] = useState<{ clientSecret: string; publishableKey: string; orderNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isPendingAction, setIsPendingAction] = useState(false);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [isBasketPulseActive, setIsBasketPulseActive] = useState(false);
  const [tableSlug, setTableSlug] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<DiningTableResponse | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateCheckout = useCallback((form: typeof checkoutForm): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.customerName || form.customerName.trim().length < 2) {
      errors.customerName = "Name must be at least 2 characters";
    }
    if (!form.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      errors.customerEmail = "Valid email is required";
    }
    if (!form.customerPhone || !/^[+\d\s\-()]{7,20}$/.test(form.customerPhone)) {
      errors.customerPhone = "Valid phone number is required";
    }
    if (form.orderKind === "delivery") {
      if (!form.deliveryAddressLine1.trim()) {
        errors.deliveryAddressLine1 = "Address line 1 is required";
      }
      if (!form.deliveryCity.trim()) {
        errors.deliveryCity = "City is required";
      }
      if (!form.deliveryPostcode.trim()) {
        errors.deliveryPostcode = "Postcode is required";
      }
    }
    return errors;
  }, []);

  const isCheckoutValid = Object.keys(fieldErrors).length === 0
    ? checkoutForm.customerName.trim().length >= 2
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutForm.customerEmail)
      && /^[+\d\s\-()]{7,20}$/.test(checkoutForm.customerPhone)
      && (checkoutForm.orderKind !== "delivery" || (
        checkoutForm.deliveryAddressLine1.trim()
        && checkoutForm.deliveryCity.trim()
        && checkoutForm.deliveryPostcode.trim()
      ))
    : false;

  const cartPromiseRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    // Handle Stripe Checkout redirect back
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const orderNumber = params.get("order");
    if (paymentStatus === "success" && orderNumber) {
      setCheckoutState(`Order ${orderNumber} — Payment confirmed! Thank you.`);
      clearStoredCartId();
      setCart(null);
      setCartId(null);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paymentStatus === "cancelled" && orderNumber) {
      setError(`Payment for order ${orderNumber} was cancelled. You can try again.`);
      window.history.replaceState({}, "", window.location.pathname);
    }

    void bootstrap();
  }, []);

  // Set orderKind from URL param after mount to avoid SSR hydration mismatch
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("table")) {
      setCheckoutForm(current => ({ ...current, orderKind: "instore" }));
    }
  }, []);

  useEffect(() => {
    if (!lastAddedProductId) return;
    const timer = window.setTimeout(() => setLastAddedProductId(null), 1400);
    return () => window.clearTimeout(timer);
  }, [lastAddedProductId]);

  useEffect(() => {
    if (!isBasketPulseActive) return;
    const timer = window.setTimeout(() => setIsBasketPulseActive(false), 700);
    return () => window.clearTimeout(timer);
  }, [isBasketPulseActive]);

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
  const homeCategories = categories.slice(0, 4);
  const featuredItems = getHomeFeaturedItems(categories).map(item => ({
    ...item,
    price: formatMoney(item.priceAmount),
    onOpen: () => openMenu(item.categoryId)
  }));
  const visibleProducts = getMerchandisedProducts(activeCategory, menuFilter);
  const activeCategoryQuickCount = activeCategory
    ? activeCategory.products.filter(product => product.modifierGroups.length === 0).length
    : 0;
  const activeCategoryCustomCount = activeCategory
    ? activeCategory.products.filter(product => product.modifierGroups.length > 0).length
    : 0;
  const showStickyBasketBar =
    basketCount > 0 && view !== "basket" && view !== "access" && paymentState !== "paying";
  const showStickyBuilderBar =
    view === "home" && basketCount === 0 && paymentState !== "paying";
  const basketUpsells = getBasketUpsellProducts(categories, cart);
  const builderStepCount = builderProduct?.modifierGroups.length ?? 0;
  const builderStepLabel = `Step ${builderStep + 1} of ${builderStepCount}`;
  const builderSelectionCount = builderGroup
    ? getSelectedCount(builderGroup, builderSelection?.selectedOptionIds ?? [])
    : 0;
  const builderGuideDetail = builderGroup
    ? builderSelectionCount >= builderGroup.minSelect
      ? storefrontContent.builder.readyLabel
      : storefrontContent.builder.requiredLabel
    : storefrontContent.builder.requiredLabel;

  function openMealDeals() {
    openMenu(categories.find(category => category.name === "Meal Deals")?.id);
  }

  function handleRouteAction(action: StorefrontRouteAction) {
    if (action === "menu") {
      openMenu();
      return;
    }

    if (action === "mealDeals") {
      openMealDeals();
      return;
    }

    openBuilder();
  }

  // Helper Functions Inside Component
  function getCategoryIcon(name: string) {
    const n = name.toLowerCase();
    if (n.includes("sandwich")) return "lunch_dining";
    if (n.includes("breakfast")) return "bakery_dining";
    if (n.includes("drink")) return "local_cafe";
    if (n.includes("deal")) return "sell";
    return "restaurant";
  }

  function formatSelections(product: Product, selection: ProductSelectionState) {
    return product.modifierGroups
      .map(group => {
        const selected = group.options
          .filter(opt => selection.selectedOptionIds.includes(opt.id))
          .map(opt => opt.name);
        return selected.length > 0 ? `${group.name}: ${selected.join(", ")}` : null;
      })
      .filter(Boolean)
      .join(" | ");
  }

  async function bootstrap() {
    try {
      setError(null);

      // Read QR table slug from URL
      const urlParams = new URLSearchParams(window.location.search);
      const qrSlug = urlParams.get("table");
      if (qrSlug) {
        setTableSlug(qrSlug);
        try {
          const table = await apiFetch<DiningTableResponse>(`/tables/public/${qrSlug}`);
          setTableInfo(table);
        } catch {
          // Invalid table slug — ignore silently
        }
      }

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

      // If the customer arrived via a table QR, start with a clean basket.
      // Otherwise customers sharing a device (or returning to the same
      // table) inherit each other's items.
      if (qrSlug) {
        clearStoredCartId();
      } else {
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
      }

      const restoredSession = await restoreBackOfficeSession();
      if (restoredSession) {
        setBackOfficeSession(restoredSession);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load the storefront.";
      setError(message);
      setMenuError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function ensureCart() {
    if (cartId) return cartId;
    if (cartPromiseRef.current) return cartPromiseRef.current;

    cartPromiseRef.current = (async () => {
      try {
        const createdCart = await apiFetch<CartResponse>("/carts", {
          method: "POST",
          body: JSON.stringify({ locationCode: "main", ...(tableSlug ? { diningTableQrSlug: tableSlug } : {}) })
        });

        setCart(createdCart);
        setCartId(createdCart.id);
        saveStoredCartId(createdCart.id);
        return createdCart.id;
      } finally {
        cartPromiseRef.current = null;
      }
    })();

    return cartPromiseRef.current;
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
        nextIds.push(optionId);
      } else if (group.minSelect > 0 && selectedInGroup.length <= group.minSelect) {
        setError(`${group.name} requires at least ${group.minSelect} option(s).`);
        return current;
      }

      setError(null);
      return {
        ...current,
        [product.id]: { ...currentState, selectedOptionIds: nextIds }
      };
    });
  }

  function updateNotes(productId: string, notes: string) {
    setSelections(current => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? { selectedOptionIds: [], notes: "" }),
        notes
      }
    }));
  }

  function goBuilderNext() {
    if (!builderProduct || !builderSelection || !builderGroup) return;
    const count = getSelectedCount(builderGroup, builderSelection.selectedOptionIds);
    if (count < builderGroup.minSelect) {
      setError(`Please select at least ${builderGroup.minSelect} for ${builderGroup.name}.`);
      return;
    }
    setError(null);
    setBuilderStep(current => Math.min(current + 1, builderProduct.modifierGroups.length - 1));
  }

  async function addProductToCart(product: Product) {
    setIsPendingAction(true);
    setError(null);
    try {
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
      const variant = product.variants.find(v => v.isDefault) ?? product.variants[0];

      const updatedCart = await apiFetch<CartResponse>(`/carts/${activeCartId}/items`, {
        method: "POST",
        body: JSON.stringify({
          productSlug: product.slug,
          variantId: variant.id,
          quantity: 1,
          selectedOptionIds: selection.selectedOptionIds,
          notes: selection.notes
        })
      });

      setCart(updatedCart);
      setLastAddedProductId(product.id);
      setIsBasketPulseActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item to basket.");
    } finally {
      setIsPendingAction(false);
    }
  }

  async function removeCartItem(itemId: string) {
    if (!cartId) return;
    startTransition(async () => {
      try {
        setError(null);
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

    const errors = validateCheckout(checkoutForm);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsPendingAction(true);
    try {
      setError(null);
      const deliveryAddress =
        checkoutForm.orderKind === "delivery"
          ? {
              line1: checkoutForm.deliveryAddressLine1.trim(),
              line2: checkoutForm.deliveryAddressLine2.trim() || undefined,
              city: checkoutForm.deliveryCity.trim(),
              postcode: checkoutForm.deliveryPostcode.trim()
            }
          : undefined;
      const result = await apiFetch<{
        order: { orderNumber: string };
        payment: { provider: string; status: string; checkoutUrl?: string; clientSecret?: string; publishableKey?: string };
      }>("/checkout/start", {
        method: "POST",
        body: JSON.stringify({
          cartId,
          idempotencyKey: crypto.randomUUID(),
          orderKind: checkoutForm.orderKind,
          customerName: checkoutForm.customerName,
          customerEmail: checkoutForm.customerEmail || undefined,
          customerPhone: checkoutForm.customerPhone || undefined,
          specialInstructions: checkoutForm.specialInstructions || undefined,
          // The table is already attached to the cart at create time, so we
          // don't pass diningTableQrSlug here — the StartCheckoutDto rejects
          // unknown properties.
          ...(deliveryAddress ? { deliveryAddress } : {})
        })
      });

      if (result.payment.checkoutUrl) {
        setIsRedirecting(true);
        window.location.href = result.payment.checkoutUrl;
      } else if (result.payment.clientSecret && result.payment.publishableKey) {
        setPendingPayment({
          clientSecret: result.payment.clientSecret,
          publishableKey: result.payment.publishableKey,
          orderNumber: result.order.orderNumber
        });
        setPaymentState("paying");
      } else {
        setCheckoutState(`Order ${result.order.orderNumber} confirmed!`);
        clearStoredCartId();
        setCart(null);
        setCartId(null);
      }
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed.");
    } finally {
      setIsPendingAction(false);
    }
  }

function StripePaymentOverlay({
  pendingPayment,
  cartTotal,
  formatMoney,
  onSuccess,
  onFailed,
  onCancel
}: {
  pendingPayment: { clientSecret: string; publishableKey: string; orderNumber: string };
  cartTotal: number;
  formatMoney: (amount: number) => string;
  onSuccess: () => void;
  onFailed: (msg: string) => void;
  onCancel: () => void;
}) {
  const stripePromise = loadStripe(pendingPayment.publishableKey);
  return (
    <div className="success-overlay">
      <div className="success-card" style={{ maxWidth: 440 }}>
        <h2>Pay for Order {pendingPayment.orderNumber}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 16px" }}>
          Total: {formatMoney(cartTotal)}
        </p>
        <Elements stripe={stripePromise} options={{ clientSecret: pendingPayment.clientSecret }}>
          <StripeCheckoutForm clientSecret={pendingPayment.clientSecret} onSuccess={onSuccess} onFailed={onFailed} onCancel={onCancel} />
        </Elements>
      </div>
    </div>
  );
}

function StripeCheckoutForm({
  clientSecret,
  onSuccess,
  onFailed,
  onCancel
}: {
  clientSecret: string;
  onSuccess: () => void;
  onFailed: (msg: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onFailed("Card input not available.");
      setIsProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card: cardElement } }
    );

    if (error) {
      onFailed(error.message || "Payment failed.");
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else {
      onFailed(`Payment status: ${paymentIntent?.status}. Please try again.`);
    }
    setIsProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        padding: "12px 14px",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        background: "rgba(255,255,255,0.04)",
        marginBottom: 16
      }}>
        <CardElement options={{
          style: {
            base: {
              color: "#fff",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "16px",
              "::placeholder": { color: "rgba(255,255,255,0.4)" }
            },
            invalid: { color: "#ff6b6b" }
          }
        }} />
      </div>
      <button type="submit" className="primary-action" disabled={!stripe || isProcessing} style={{ width: "100%" }}>
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
      <button type="button" style={{ marginTop: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text)", padding: "10px 24px", borderRadius: 8, cursor: "pointer", width: "100%" }} onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

  if (isLoading) {
    return (
      <main className="storefront-app" aria-busy="true" aria-label="Loading storefront">
        <div className="app-header-shell">
          <header className="app-header">
            <div className="header-brand">
              <div className="brand-logo">
                <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 16 }} aria-hidden="true" />
              </div>
              <div className="header-brand-copy">
                <div className="skeleton" style={{ width: 120, height: 20, marginBottom: 4 }} aria-hidden="true" />
                <div className="skeleton" style={{ width: 100, height: 12 }} aria-hidden="true" />
              </div>
            </div>
          </header>
        </div>
        <section className="home-view" aria-label="Loading content">
          <div style={{ padding: "0 var(--page-gutter)" }}>
            <div className="skeleton" style={{ width: "60%", height: 48, marginBottom: 16 }} aria-hidden="true" />
            <div className="skeleton" style={{ width: "80%", height: 16, marginBottom: 8 }} aria-hidden="true" />
            <div className="skeleton" style={{ width: "45%", height: 16, marginBottom: 24 }} aria-hidden="true" />
            <div style={{ display: "flex", gap: 10 }}>
              <div className="skeleton" style={{ width: 140, height: 48, borderRadius: 50 }} aria-hidden="true" />
              <div className="skeleton" style={{ width: 160, height: 48, borderRadius: 50 }} aria-hidden="true" />
            </div>
          </div>
          <div style={{ padding: "24px var(--page-gutter)" }}>
            <div className="skeleton" style={{ width: "40%", height: 14, marginBottom: 8 }} aria-hidden="true" />
            <div className="skeleton" style={{ width: "55%", height: 22, marginBottom: 16 }} aria-hidden="true" />
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr" }}>
              <div className="skeleton-card" style={{ height: 120 }} aria-hidden="true" />
              <div className="skeleton-card" style={{ height: 120 }} aria-hidden="true" />
              <div className="skeleton-card" style={{ height: 120 }} aria-hidden="true" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error && !catalog) {
    return (
      <main className="storefront-app" aria-label={BRAND_NAME + " storefront"}>
        <div className="app-header-shell">
          <header className="app-header">
            <div className="header-brand" style={{ cursor: "default" }}>
              <div className="brand-logo">
                <Image src="/logo.svg" alt={`${BRAND_NAME} logo`} fill sizes="56px" priority />
              </div>
              <div className="header-brand-copy">
                <strong>{BRAND_NAME}</strong>
                <span>{BRAND_TAGLINE}</span>
              </div>
            </div>
          </header>
        </div>
        <div className="menu-error-card" role="alert">
          <span className="material-icons error-card-icon" aria-hidden="true">error_outline</span>
          <h2>Could not load the menu</h2>
          <p>{error}</p>
          <button type="button" className="primary-action" onClick={() => void bootstrap()} aria-label="Retry loading menu">
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="storefront-app" aria-label={BRAND_NAME + " storefront"}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="app-header-shell">
        <header className="app-header">
          <button type="button" className="header-brand" onClick={() => setView("home")} aria-label="Return to home">
            <div className="brand-logo">
              <Image src="/logo.svg" alt={`${BRAND_NAME} logo`} fill sizes="56px" priority />
            </div>
            <div className="header-brand-copy">
              <strong>{BRAND_NAME}</strong>
              <span>{BRAND_TAGLINE}</span>
              {tableInfo && (
                <span className="header-table-badge">Table {tableInfo.name || tableInfo.tableNumber}</span>
              )}
            </div>
            <div className={isBasketPulseActive ? "header-brand-status header-brand-status-pulse" : "header-brand-status"}>
              <span>{basketCount ? `${basketCount} in basket` : "Order online"}</span>
            </div>
          </button>
          <div className="header-actions">
            {basketCount > 0 && (
              <button
                type="button"
                className={isBasketPulseActive ? "header-cart-btn header-cart-btn-pulse" : "header-cart-btn"}
                onClick={() => { setView("basket"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                aria-label={`View basket: ${basketCount} item${basketCount === 1 ? "" : "s"}, ${formatMoney(cart?.totalAmount ?? 0)}`}
              >
                <span className="material-icons" aria-hidden="true" style={{ fontSize: 20 }}>shopping_bag</span>
                <span className="header-cart-badge">{basketCount}</span>
                <span className="header-cart-total">{formatMoney(cart?.totalAmount ?? 0)}</span>
              </button>
            )}
            <button type="button" className="drawer-trigger" onClick={() => setIsDrawerOpen(true)} aria-label="Open category navigation">
              Browse
            </button>
          </div>
        </header>
      </div>

      <div id="main-content" tabIndex={-1} />

      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)} role="dialog" aria-modal="true" aria-label="Category navigation">
          <nav className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-head">
              <strong>All Categories</strong>
              <button type="button" aria-label="Close category navigation" onClick={() => setIsDrawerOpen(false)}>Close</button>
            </div>
            <div className="drawer-links">
              {categories.map(category => (
                <button
                  key={category.id}
                  className="drawer-link"
                  onClick={() => openMenu(category.id)}
                  aria-label={`Browse ${category.name}`}
                >
                  <span className="material-icons category-icon" aria-hidden="true">
                    {getCategoryIcon(category.name)}
                  </span>
                  {category.name}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}

      {error && (
        <div className="error-toast" role="alert" aria-live="assertive">
          <span className="material-icons error-card-icon" aria-hidden="true">error_outline</span>
          <p>{error}</p>
          <div className="error-toast-actions">
            <button type="button" className="primary-action" onClick={() => void bootstrap()} aria-label="Retry loading storefront">
              Retry
            </button>
            <button type="button" className="dismiss-btn" onClick={() => setError(null)} aria-label="Dismiss error">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {isRedirecting && (
        <div className="checkout-redirect-overlay" role="status" aria-live="polite">
          <div className="spinner" />
          <p>Redirecting to payment...</p>
        </div>
      )}

      {checkoutState && paymentState !== "paying" && (
        <div className="success-overlay">
          <div className="success-card">
            <span className="material-icons" aria-hidden="true" style={{ fontSize: 48, color: "var(--green)", marginBottom: 8 }}>check_circle</span>
            <h2>Order confirmed!</h2>
            <p>{checkoutState}</p>
            <button className="primary-action" onClick={() => { setCheckoutState(null); setPaymentState("idle"); }}>
              Back to Store
            </button>
          </div>
        </div>
      )}

      {paymentState === "paying" && pendingPayment && (
        <StripePaymentOverlay
          pendingPayment={pendingPayment}
          cartTotal={cart?.totalAmount ?? 0}
          formatMoney={formatMoney}
          onSuccess={() => {
            setPaymentState("confirmed");
            setCheckoutState(`Order ${pendingPayment.orderNumber} — Payment confirmed! Thank you.`);
            clearStoredCartId();
            setCart(null);
            setCartId(null);
            setPendingPayment(null);
          }}
          onFailed={(msg: string) => {
            setPaymentState("failed");
            setError(msg);
          }}
          onCancel={() => { setPaymentState("idle"); setPendingPayment(null); setError(null); }}
        />
      )}

      {paymentState === "failed" && (
        <div className="success-overlay">
          <div className="success-card payment-failed-card">
            <span className="material-icons" aria-hidden="true" style={{ fontSize: 48, color: "var(--primary)", marginBottom: 8 }}>error_outline</span>
            <h2>Payment Failed</h2>
            <p>{error || "Your card was not charged. Please try again."}</p>
            <button className="primary-action" onClick={() => { setPaymentState("paying"); setError(null); }} aria-label="Retry payment">
              Try Again
            </button>
            <button type="button" className="dismiss-btn" style={{ marginTop: 12 }} onClick={() => { setPaymentState("idle"); setPendingPayment(null); setError(null); }} aria-label="Cancel payment">
              Cancel
            </button>
          </div>
        </div>
      )}

      {view === "home" ? (
        <section className="home-view view-enter">
          <StorefrontHero
            basketCount={basketCount}
            brandName={BRAND_NAME}
            onBrowseFavourites={() => openMenu()}
            onStartBuilding={() => openBuilder()}
          />
          <TrustStrip />
          <SocialProof items={storefrontContent.socialProof} />

          <SectionShell
            eyebrow="Order your way"
            title="Start with the sandwich builder"
            body="Build your sandwich first, or jump into ready-made favourites when you already know what you want."
          >
            <OrderPaths onRouteSelect={handleRouteAction} />
          </SectionShell>

          <SectionShell
            eyebrow="Tuckinn favourites"
            title="Popular picks ready fast"
          >
            <FeaturedGrid items={featuredItems} />
          </SectionShell>

          <SectionShell eyebrow="Menu overview" title="Choose a section">
            <div className="category-grid">
              {homeCategories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  className="category-card"
                  onClick={() => openMenu(category.id)}
                  aria-label={`Browse ${category.name}: ${category.products.length} items`}
                >
                  <div className="category-card-top">
                    <span className="category-card-title">
                      <span className="material-icons category-icon" aria-hidden="true">
                        {getCategoryIcon(category.name)}
                      </span>
                      {category.name}
                    </span>
                    <em>{category.products.length} items</em>
                  </div>
                  <strong>{category.description || "Open this section and browse all items."}</strong>
                  <div className="category-card-meta">
                    <span>{getCategoryMixLabel(category)}</span>
                    <span>{getCategorySummary(category)}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="utility-link-row">
              <button type="button" className="text-link" onClick={() => setIsDrawerOpen(true)}>
                Open all menu sections
              </button>
            </div>
          </SectionShell>

        </section>
      ) : null}

      {view === "menu" ? (
        <section className="menu-view view-enter">
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
            <div className="panel-head">
              <div>
                <p className="section-kicker">Browse this section</p>
                <h2>{visibleProducts.length} item{visibleProducts.length === 1 ? "" : "s"} to choose from</h2>
              </div>
              <span className="support-badge">
                {MENU_FILTERS.find(filter => filter.value === menuFilter)?.label ?? "Show all"}
              </span>
            </div>
            <p className="menu-helper-copy">
              Ready-made items add straight away. Build your own stays available when you want full control.
            </p>
            <MenuRail
              categories={categories.map(category => ({ id: category.id, name: category.name }))}
              activeCategoryId={activeCategory?.id ?? null}
              onSelect={openMenu}
            />
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
            {menuError && !catalog ? (
              <div className="menu-error-card" role="alert">
                <span className="material-icons error-card-icon" aria-hidden="true">error_outline</span>
                <h2>Could not load the menu</h2>
                <p>{menuError}</p>
                <button type="button" className="primary-action" onClick={() => void bootstrap()} aria-label="Retry loading menu">
                  Try again
                </button>
              </div>
            ) : null}
            {activeCategory ? (
              <CategoryStory
                title="Fast lunch favourites first"
                description={
                  activeCategory.description ||
                  "Ready-made picks stay first for a faster lunch."
                }
                quickCount={activeCategoryQuickCount}
                customCount={activeCategoryCustomCount}
              />
            ) : null}
            {visibleProducts.map(product => {
              const selection = selections[product.id] ?? {
                selectedOptionIds: getDefaultOptionIds(product),
                notes: ""
              };
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  selection={selection}
                  priceLabel={formatMoney(getProductPrice(product, selection))}
                  isPendingAction={isPendingAction}
                  isRecentlyAdded={lastAddedProductId === product.id}
                  onCustomise={() => openBuilder(product.id)}
                  onAdd={() => void addProductToCart(product)}
                />
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

      {view === "builder" && builderProduct && builderSelection && (
        <section className="builder-view view-enter">
          <div className="builder-header">
            <p className="section-kicker">{builderProduct.name}</p>
            <h1>Sandwich Builder</h1>
            <p>{builderProduct.shortDescription}</p>
          </div>

          <div className="progress-track">
            {builderProduct.modifierGroups.map((group, idx) => (
              <button
                key={group.id}
                className={`step-dot ${idx === builderStep ? "active" : ""} ${
                  getSelectedCount(group, builderSelection.selectedOptionIds) >= group.minSelect ? "done" : ""
                }`}
                onClick={() => setBuilderStep(idx)}
                title={group.name}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div className="builder-layout">
            <div className="builder-stage">
              <BuilderGuide
                currentStep={builderStep + 1}
                totalSteps={builderStepCount}
                title={builderGroup?.name || builderStepLabel}
                body={
                  builderStepCount > 1
                    ? storefrontContent.builder.progressIntro
                    : storefrontContent.builder.progressSingle
                }
                detail={
                  builderGroup
                    ? `${builderGuideDetail} • ${
                        builderGroup.maxSelect === 1
                          ? "Choose 1 option"
                          : `Choose ${builderGroup.minSelect} to ${builderGroup.maxSelect} options`
                      }`
                    : builderGuideDetail
                }
              />

              <div className="stage-head">
                <h2>{builderGroup?.name}</h2>
                <p>{builderGroup?.description || "Select from the options below"}</p>
              </div>

              <div className="options-grid">
                {builderGroup?.options.map(option => {
                  const isSelected = builderSelection.selectedOptionIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      className={`option-tile ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleOption(builderProduct, builderGroup!, option.id)}
                    >
                      <div className="tile-content">
                        <strong>{option.name}</strong>
                        {option.priceDeltaAmount > 0 && (
                          <span className="price-tag">+{formatMoney(option.priceDeltaAmount)}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="builder-nav">
                <button
                  className="secondary-action"
                  disabled={builderStep === 0}
                  onClick={() => setBuilderStep(s => s - 1)}
                >
                  Back
                </button>
                {builderStep < builderProduct.modifierGroups.length - 1 ? (
                  <button className="primary-action" onClick={goBuilderNext}>
                    Next step
                  </button>
                ) : (
                  <button
                    className="primary-action"
                    disabled={isPendingAction}
                    onClick={() => void addProductToCart(builderProduct)}
                  >
                    {isPendingAction ? "Adding..." : "Add to Order"}
                  </button>
                )}
              </div>
            </div>

            <aside className="builder-summary">
              <h3>Order Summary</h3>
              <div className="summary-content">
                <div className="summary-price">
                  <span>Total Price</span>
                  <strong>{formatMoney(getProductPrice(builderProduct, builderSelection))}</strong>
                </div>
                <div className="summary-details">
                  {builderProduct.modifierGroups.map(group => (
                    <div key={group.id} className="summary-item">
                      <strong>{group.name}</strong>
                      <p>{getSelectionLabel(group, builderSelection.selectedOptionIds)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {view === "builder" && (!builderProduct || !builderSelection) ? (
        <section className="builder-view view-enter">
          <div className="builder-header">
            <p className="section-kicker">Build it your way</p>
            <h1>Sandwich Builder</h1>
            <p>Custom builder options are not available yet. Browse favourites while we prepare them.</p>
          </div>
          <button type="button" className="secondary-action" onClick={() => openMenu()}>
            Browse Favourites
          </button>
        </section>
      ) : null}

      {view === "basket" ? (
        <section className="basket-view view-enter">
          <nav className="step-indicator" aria-label="Checkout progress">
            <span className={`step-indicator-step${view === "basket" && !checkoutState ? " step-indicator-step-active" : ""}`}>
              <span className="material-icons" aria-hidden="true">restaurant_menu</span>
              Menu
            </span>
            <span className={`step-indicator-divider${basketCount > 0 ? " step-indicator-divider-done" : ""}`} />
            <span className={`step-indicator-step${view === "basket" && !checkoutState ? " step-indicator-step-active" : ""}`}>
              <span className="material-icons" aria-hidden="true">shopping_bag</span>
              Details
            </span>
            <span className="step-indicator-divider" />
            <span className={`step-indicator-step${paymentState === "paying" || paymentState === "confirmed" ? " step-indicator-step-active" : ""}`}>
              <span className="material-icons" aria-hidden="true">credit_card</span>
              Payment
            </span>
            <span className="step-indicator-divider" />
            <span className={`step-indicator-step${checkoutState ? " step-indicator-step-active step-indicator-step-done" : ""}`}>
              <span className="material-icons" aria-hidden="true">check_circle</span>
              Confirmed
            </span>
          </nav>
          <button type="button" className="back-to-menu-btn" onClick={() => openMenu()} aria-label="Back to menu">
            <span className="material-icons" aria-hidden="true" style={{ fontSize: 18 }}>arrow_back</span>
            Back to menu
          </button>
          <div className="basket-layout">
            <section className="content-panel">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Your order</p>
                  <h2>Basket</h2>
                </div>
                <strong>{basketCount} item(s)</strong>
              </div>
              <div className="basket-helper-card">
                <strong>Check your basket first.</strong>
                <p>Remove anything you do not want before moving on to your details.</p>
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
              <BasketUpsells
                body={storefrontContent.basket.upsellBody}
                products={basketUpsells}
                selections={selections}
                isPendingAction={isPendingAction}
                onAdd={product => {
                  void addProductToCart(product);
                }}
              />
              <div className="basket-totals">
                <div><span>Subtotal</span><strong>{formatMoney(cart?.subtotalAmount ?? 0)}</strong></div>
                <div><span>Total</span><strong>{formatMoney(cart?.totalAmount ?? 0)}</strong></div>
              </div>
            </section>

            <section className="content-panel basket-checkout-panel">
              <div className="panel-head">
                <div>
                  <p className="section-kicker">Checkout</p>
                  <h2>Your details</h2>
                </div>
              </div>
              <p className="basket-checkout-intro">
                {storefrontContent.basket.intro}
              </p>
              <div className="basket-reassurance-list">
                {storefrontContent.basket.reassurance.map(item => (
                  <span key={item} className="basket-reassurance-pill">
                    {item}
                  </span>
                ))}
              </div>
              <form className="checkout-form" onSubmit={handleCheckout} noValidate>
                <label className="field">
                  Full name
                  <input className={`text-input${fieldErrors.customerName ? " text-input-error" : ""}`} value={checkoutForm.customerName} onChange={event => { setCheckoutForm(current => ({ ...current, customerName: event.target.value })); if (fieldErrors.customerName) setFieldErrors(prev => { const next = { ...prev }; delete next.customerName; return next; }); }} required aria-invalid={!!fieldErrors.customerName} />
                  {fieldErrors.customerName && <span className="field-error" role="alert">{fieldErrors.customerName}</span>}
                </label>
                <label className="field">
                  Email
                  <input className={`text-input${fieldErrors.customerEmail ? " text-input-error" : ""}`} type="email" inputMode="email" value={checkoutForm.customerEmail} onChange={event => { setCheckoutForm(current => ({ ...current, customerEmail: event.target.value })); if (fieldErrors.customerEmail) setFieldErrors(prev => { const next = { ...prev }; delete next.customerEmail; return next; }); }} aria-invalid={!!fieldErrors.customerEmail} />
                  {fieldErrors.customerEmail && <span className="field-error" role="alert">{fieldErrors.customerEmail}</span>}
                </label>
                <label className="field">
                  Phone
                  <input className={`text-input${fieldErrors.customerPhone ? " text-input-error" : ""}`} inputMode="tel" value={checkoutForm.customerPhone} onChange={event => { setCheckoutForm(current => ({ ...current, customerPhone: event.target.value })); if (fieldErrors.customerPhone) setFieldErrors(prev => { const next = { ...prev }; delete next.customerPhone; return next; }); }} aria-invalid={!!fieldErrors.customerPhone} />
                  {fieldErrors.customerPhone && <span className="field-error" role="alert">{fieldErrors.customerPhone}</span>}
                </label>
                <label className="field">
                  Order type
                  {tableInfo ? (
                    <input className="text-input" value={`Dine-in ${tableInfo.name || "Table " + tableInfo.tableNumber}`} readOnly />
                  ) : (
                    <select className="select-input" value={checkoutForm.orderKind} onChange={event => setCheckoutForm(current => ({ ...current, orderKind: event.target.value }))}>
                      <option value="collect">Collect from store</option>
                      <option value="delivery">Delivery</option>
                      <option value="instore">Dine-in</option>
                    </select>
                  )}
                </label>
                {checkoutForm.orderKind === "delivery" ? (
                  <fieldset className="delivery-address-panel">
                    <legend className="delivery-address-heading" role="heading" aria-level={3}>
                      Delivery address
                    </legend>
                    <label className="field">
                      Address line 1
                      <input
                        className="text-input"
                        value={checkoutForm.deliveryAddressLine1}
                        onChange={event =>
                          setCheckoutForm(current => ({
                            ...current,
                            deliveryAddressLine1: event.target.value
                          }))
                        }
                        autoComplete="address-line1"
                        required
                      />
                    </label>
                    <label className="field">
                      Address line 2
                      <input
                        className="text-input"
                        value={checkoutForm.deliveryAddressLine2}
                        onChange={event =>
                          setCheckoutForm(current => ({
                            ...current,
                            deliveryAddressLine2: event.target.value
                          }))
                        }
                        autoComplete="address-line2"
                      />
                    </label>
                    <div className="checkout-field-grid">
                      <label className="field">
                        Town or city
                        <input
                          className="text-input"
                          value={checkoutForm.deliveryCity}
                          onChange={event =>
                            setCheckoutForm(current => ({
                              ...current,
                              deliveryCity: event.target.value
                            }))
                          }
                          autoComplete="address-level2"
                          required
                        />
                      </label>
                      <label className="field">
                        Postcode
                        <input
                          className="text-input"
                          value={checkoutForm.deliveryPostcode}
                          onChange={event =>
                            setCheckoutForm(current => ({
                              ...current,
                              deliveryPostcode: event.target.value
                            }))
                          }
                          autoComplete="postal-code"
                          required
                        />
                      </label>
                    </div>
                  </fieldset>
                ) : null}
                <label className="field">
                  Kitchen notes
                  <textarea className="text-area" value={checkoutForm.specialInstructions} onChange={event => setCheckoutForm(current => ({ ...current, specialInstructions: event.target.value }))} placeholder="Pickup timing, allergies, or delivery notes" />
                </label>
                <button type="submit" className="primary-action" disabled={isPendingAction || !cart?.items.length || !isCheckoutValid}>
                  {isPendingAction ? "Placing Order..." : "Proceed to Payment"}
                </button>
                <p className="checkout-note">
                  You will be asked to confirm payment with your card after placing the order.
                </p>
              </form>
            </section>
          </div>
        </section>
      ) : null}

      {view === "access" ? (
        <section className="access-view view-enter">
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
                    <button type="button" className="secondary-action" onClick={() => openDashboard(API_APP_URL)}>
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
                  <span>{API_APP_URL}</span>
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {showStickyBasketBar ? (
        <button
          type="button"
          className={isBasketPulseActive ? "sticky-basket-bar sticky-basket-bar-pulse" : "sticky-basket-bar"}
          onClick={() => {
            setView("basket");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="sticky-basket-copy">
            <strong>{basketCount} item{basketCount === 1 ? "" : "s"} ready</strong>
            <span>{formatMoney(cart?.totalAmount ?? 0)}</span>
          </span>
          <span className="sticky-basket-action">View basket</span>
        </button>
      ) : null}

      {showStickyBuilderBar ? (
        <button
          type="button"
          className="sticky-builder-bar"
          aria-label="Open sticky sandwich builder action"
          onClick={() => openBuilder()}
        >
          <span>Build your sandwich</span>
          <strong>Start Building</strong>
        </button>
      ) : null}

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button type="button" className={view === "home" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} onClick={() => setView("home")} aria-label="Home" aria-current={view === "home" ? "page" : undefined}>
          <span className="material-icons" aria-hidden="true" style={{ fontSize: 20 }}>home</span>
          Home
        </button>
        <button type="button" className={view === "menu" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} onClick={() => openMenu()} aria-label="Menu" aria-current={view === "menu" ? "page" : undefined}>
          <span className="material-icons" aria-hidden="true" style={{ fontSize: 20 }}>restaurant_menu</span>
          Menu
        </button>
        <button type="button" className={view === "builder" ? "bottom-nav-item bottom-nav-item-active" : "bottom-nav-item"} onClick={() => openBuilder()} aria-label="Sandwich Builder" aria-current={view === "builder" ? "page" : undefined}>
          <span className="material-icons" aria-hidden="true" style={{ fontSize: 20 }}>lunch_dining</span>
          Builder
        </button>
        <button type="button" className={view === "basket" ? "bottom-nav-item bottom-nav-item-active" : isBasketPulseActive ? "bottom-nav-item bottom-nav-item-pulse" : "bottom-nav-item"} onClick={() => setView("basket")} aria-label={`Basket with ${basketCount} items`} aria-current={view === "basket" ? "page" : undefined}>
          <span className="material-icons" aria-hidden="true" style={{ fontSize: 20 }}>shopping_bag</span>
          Basket{basketCount > 0 ? ` (${basketCount})` : ""}
        </button>
      </nav>
    </main>
  );
}

function getHomeFeaturedItems(categories: Category[]) {
  const featured = categories.flatMap(category =>
    category.products
      .filter(product => product.isFeatured)
      .map(product => ({
        id: product.id,
        categoryId: category.id,
        categoryName: category.name,
        productName: product.name,
        description: product.shortDescription || "Prepared for a faster lunch decision.",
        priceAmount:
          product.variants.find(variant => variant.isDefault)?.priceAmount ??
          product.variants[0]?.priceAmount ??
          0,
        highlight:
          product.modifierGroups.length > 0 ? "Customisable" : "Ready-made favourite",
        imageUrl: product.imageUrl,
        imageAlt: product.imageAltText || product.name
      }))
  );

  if (featured.length >= 3) {
    return featured.slice(0, 3);
  }

  const fallback = categories.flatMap(category =>
    category.products.slice(0, 1).map(product => ({
      id: product.id,
      categoryId: category.id,
      categoryName: category.name,
      productName: product.name,
      description: product.shortDescription || "Prepared for a faster lunch decision.",
      priceAmount:
        product.variants.find(variant => variant.isDefault)?.priceAmount ??
        product.variants[0]?.priceAmount ??
        0,
      highlight:
        product.modifierGroups.length > 0 ? "Customisable" : "Ready-made favourite",
      imageUrl: product.imageUrl,
      imageAlt: product.imageAltText || product.name
    }))
  );

  return fallback.slice(0, 3);
}
