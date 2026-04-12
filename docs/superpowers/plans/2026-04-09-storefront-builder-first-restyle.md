# Storefront Builder-First Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the storefront so the sandwich builder is the main homepage differentiator and the clearest conversion route.

**Architecture:** Keep the current Next.js storefront and existing client-side view switching. Change content hierarchy, add a focused builder preview component, update responsive CSS, and verify with Playwright that builder is first, visible, clickable, and responsive.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Playwright, pnpm.

---

## Best Skills And Agent Setup

Use these skills in this order:

- `test-driven-development`: Write failing Playwright expectations before changing the UI.
- `ui-ux-pro-max`: Apply the builder-first design system and mobile-first UX decisions.
- `react-expert`: Implement the hero CTA, builder preview component, and route hierarchy.
- `playwright-expert`: Add viewport coverage for mobile, tablet, and laptop.
- `verification-before-completion`: Run tests and production build before claiming complete.

Recommended agents if the user explicitly approves subagents:

- Main agent: owns sequencing, code review, and final verification.
- UI/UX worker: owns copy hierarchy, visual treatment, and responsive layout decisions.
- React worker: owns component changes in `platform/apps/storefront/app/_storefront`.
- Test worker: owns Playwright test updates in `platform/tests/storefront`.
- Review worker: checks accessibility, route behaviour, and no checkout/API regressions.

---

## File Structure

- Modify: `platform/apps/storefront/app/_storefront/content.ts`
  - Owns homepage copy, route order, trust proof, builder explainer copy, and builder labels.

- Modify: `platform/apps/storefront/app/_storefront/hero.tsx`
  - Owns the builder-first hero layout and hero CTAs.

- Create: `platform/apps/storefront/app/_storefront/builder-preview.tsx`
  - Owns the "Sandwich Studio" preview card shown in the hero.

- Modify: `platform/apps/storefront/app/_storefront/order-paths.tsx`
  - Keeps route rendering simple and makes the first builder route visually primary through content class names.

- Modify: `platform/apps/storefront/app/page.tsx`
  - Passes `openBuilder` and `openMenu` actions into the hero and keeps existing API/cart flow unchanged.

- Modify: `platform/apps/storefront/app/globals.css`
  - Adds builder-first hero styling, builder preview styling, responsive layout, and homepage sticky builder CTA styles.

- Modify: `platform/tests/storefront/home.spec.ts`
  - Updates homepage assertions from menu-first to builder-first and adds viewport checks.

- Modify: `platform/tests/storefront/order-flow.spec.ts`
  - Only adjust if existing selectors depend on old copy.

---

## Task 1: Write The Builder-First Homepage Test

**Files:**
- Modify: `platform/tests/storefront/home.spec.ts`

- [x] **Step 1: Update the homepage headline and CTA expectations**

Replace the first test's hero expectations with builder-first assertions:

```ts
await expect(
  page.getByRole("heading", { name: /Build your proper sandwich/i })
).toBeVisible();
await expect(
  page.getByText(/Choose bread, fillings, salad, and sauce/i)
).toBeVisible();
await expect(page.getByRole("button", { name: "Start Building" })).toBeVisible();
await expect(page.getByRole("button", { name: "Browse Favourites" })).toBeVisible();
```

- [x] **Step 2: Assert builder is the first and signature route**

Add this to the same test after the route buttons are visible:

```ts
const routeCards = page.locator(".order-path-card");
await expect(routeCards.first()).toContainText("Build A Sandwich");
await expect(routeCards.first()).toContainText("Signature route");
await expect(routeCards.first()).toHaveClass(/order-path-card-primary/);
```

- [x] **Step 3: Assert the hero CTA opens the builder**

Add this test:

```ts
test("primary homepage CTA opens the sandwich builder", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Start Building" }).click();

  await expect(page.getByRole("heading", { name: /Sandwich Builder/i })).toBeVisible();
  await expect(page.locator(".builder-view")).toBeVisible();
});
```

- [x] **Step 4: Run the test and verify it fails before implementation**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts
```

Expected result: fail because the current homepage still says `Proper deli food with a quicker way to order.`, the primary CTA does not exist, and the builder route is third.

---

## Task 2: Make Storefront Content Builder-First

**Files:**
- Modify: `platform/apps/storefront/app/_storefront/content.ts`

- [x] **Step 1: Replace hero copy**

Set the hero content to this hierarchy:

```ts
hero: {
  eyebrow: "Build it your way",
  title: "Build your proper sandwich",
  body:
    "Choose bread, fillings, salad, and sauce in a guided builder, then check out without losing the quick lunch pace.",
  chips: ["Bread", "Fillings", "Salad", "Sauce"],
  brandTitle: "Your sandwich, built properly.",
  brandBody:
    "The builder is the Tuckinn difference: more control than a standard menu, without making lunch feel slow.",
  notes: [
    {
      title: "Start with the builder.",
      body: "Pick your base, layer the flavour, then review before adding to basket."
    },
    {
      title: "Quick picks stay close."
    }
  ]
}
```

- [x] **Step 2: Reorder route cards**

Set `routes` to builder first, menu second, meal deals third:

```ts
routes: [
  {
    action: "builder",
    tag: "Signature route",
    title: "Build A Sandwich",
    body: "Choose bread, fillings, salad, and sauce in the guided Tuckinn builder.",
    className: "route-card route-card-primary route-card-large"
  },
  {
    action: "menu",
    tag: "Ready-made favourites",
    title: "Browse The Menu",
    body: "See popular deli picks and add ready-made items quickly.",
    className: "route-card route-card-large"
  },
  {
    action: "mealDeals",
    tag: "Fastest bundle",
    title: "Open Meal Deals",
    body: "Go straight to simple lunch bundles when speed matters most.",
    className: "route-card route-card-large"
  }
]
```

- [x] **Step 3: Update order steps**

Use builder-specific steps:

```ts
orderSteps: [
  {
    number: "1",
    title: "Pick your base",
    body: "Start with the sandwich style that suits your lunch."
  },
  {
    number: "2",
    title: "Layer the flavour",
    body: "Choose fillings, salad, sauce, and extras clearly."
  },
  {
    number: "3",
    title: "Review and order",
    body: "Check the build, add it to basket, then checkout."
  }
]
```

- [x] **Step 4: Run the home test**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts
```

Expected result: still fail because hero buttons and builder preview have not been implemented yet.

---

## Task 3: Add The Sandwich Studio Preview Component

**Files:**
- Create: `platform/apps/storefront/app/_storefront/builder-preview.tsx`

- [x] **Step 1: Create the component**

Create:

```tsx
type BuilderPreviewProps = {
  basketCount: number;
  onStartBuilding: () => void;
};

const previewLayers = [
  { label: "Bread", value: "Soft roll or wrap" },
  { label: "Fillings", value: "Fresh deli layers" },
  { label: "Finish", value: "Salad, sauce, extras" }
];

export function BuilderPreview({ basketCount, onStartBuilding }: BuilderPreviewProps) {
  return (
    <aside className="builder-preview" aria-label="Sandwich builder preview">
      <div className="builder-preview-topline">
        <span>Sandwich Studio</span>
        <strong>{basketCount ? `${basketCount} in basket` : "Ready to build"}</strong>
      </div>
      <div className="builder-preview-card">
        <p className="section-kicker">Guided builder</p>
        <h2>Your lunch, layer by layer</h2>
        <div className="builder-preview-layers">
          {previewLayers.map(layer => (
            <div className="builder-preview-layer" key={layer.label}>
              <span>{layer.label}</span>
              <strong>{layer.value}</strong>
            </div>
          ))}
        </div>
        <button type="button" className="primary-action builder-preview-action" onClick={onStartBuilding}>
          Start Building
        </button>
      </div>
    </aside>
  );
}
```

- [x] **Step 2: Run TypeScript/build check after integration task, not yet**

Do not run build yet. The component is unused until Task 4.

---

## Task 4: Replace The Hero With Builder-First CTAs

**Files:**
- Modify: `platform/apps/storefront/app/_storefront/hero.tsx`
- Modify: `platform/apps/storefront/app/page.tsx`

- [x] **Step 1: Update hero props**

Change the hero props to accept builder and menu actions:

```ts
type StorefrontHeroProps = {
  basketCount: number;
  brandName: string;
  onBrowseFavourites: () => void;
  onStartBuilding: () => void;
};
```

- [x] **Step 2: Import and render `BuilderPreview`**

In `hero.tsx`, import:

```ts
import { BuilderPreview } from "./builder-preview";
```

Replace the current right-side brand badge with:

```tsx
<BuilderPreview basketCount={basketCount} onStartBuilding={onStartBuilding} />
```

- [x] **Step 3: Add hero action buttons**

Add the action row under the hero chips:

```tsx
<div className="hero-action-row">
  <button type="button" className="primary-action hero-primary-action" onClick={onStartBuilding}>
    Start Building
  </button>
  <button type="button" className="secondary-action hero-secondary-action" onClick={onBrowseFavourites}>
    Browse Favourites
  </button>
</div>
```

- [x] **Step 4: Update page usage**

In `page.tsx`, replace the hero props with:

```tsx
<StorefrontHero
  basketCount={basketCount}
  brandName={BRAND_NAME}
  onBrowseFavourites={() => openMenu()}
  onStartBuilding={openBuilder}
/>
```

- [x] **Step 5: Remove unused `brandTagline` hero prop**

Keep `BRAND_TAGLINE` only if used elsewhere. If it becomes unused, remove the constant to satisfy lint/build.

- [x] **Step 6: Run the focused home test**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts
```

Expected result: the new CTA test should pass or fail only on styling/responsive assertions that are handled in Task 5.

---

## Task 5: Restyle Hero, Route Cards, And Mobile Builder CTA

**Files:**
- Modify: `platform/apps/storefront/app/globals.css`
- Modify: `platform/apps/storefront/app/page.tsx`

- [x] **Step 1: Add hero CTA styles**

Add:

```css
.hero-action-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 20px;
}

.hero-primary-action,
.hero-secondary-action {
  min-height: 52px;
  justify-content: center;
}
```

- [x] **Step 2: Add builder preview styles**

Add:

```css
.builder-preview {
  margin-top: 24px;
}

.builder-preview-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: var(--primary-strong);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.builder-preview-card {
  padding: 22px;
  border-radius: 28px;
  border: 1px solid rgba(202, 138, 4, 0.22);
  background:
    radial-gradient(circle at top right, rgba(254, 243, 199, 0.9), transparent 40%),
    linear-gradient(180deg, rgba(255, 253, 250, 0.96), rgba(255, 244, 236, 0.92));
  box-shadow: 0 24px 60px rgba(127, 29, 29, 0.14);
}

.builder-preview-card h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 0.94;
  color: var(--primary-strong);
  text-transform: uppercase;
}

.builder-preview-layers {
  display: grid;
  gap: 10px;
  margin: 18px 0;
}

.builder-preview-layer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(127, 29, 29, 0.1);
}

.builder-preview-layer span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.builder-preview-layer strong {
  color: var(--text);
  text-align: right;
}

.builder-preview-action {
  width: 100%;
  min-height: 52px;
}
```

- [x] **Step 3: Make builder route visually primary**

Add or update:

```css
.order-path-card-primary {
  border-color: rgba(202, 138, 4, 0.34);
  background:
    radial-gradient(circle at top right, rgba(254, 243, 199, 0.82), transparent 44%),
    linear-gradient(180deg, rgba(255, 253, 250, 0.98), rgba(255, 241, 230, 0.94));
  box-shadow: 0 20px 48px rgba(127, 29, 29, 0.14);
}
```

- [x] **Step 4: Add responsive layout rules**

Add:

```css
@media (min-width: 768px) {
  .hero-action-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 520px;
  }

  .order-path-card:first-child {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1024px) {
  .builder-preview {
    margin-top: 0;
  }
}

@media (min-width: 1200px) {
  .order-path-card:first-child {
    grid-column: auto;
  }
}
```

- [x] **Step 5: Add homepage-only sticky builder CTA**

In `page.tsx`, add a condition:

```ts
const showStickyBuilderBar =
  view === "home" && basketCount === 0 && paymentState !== "paying";
```

Render before bottom nav:

```tsx
{showStickyBuilderBar ? (
  <button type="button" className="sticky-builder-bar" onClick={openBuilder}>
    <span>Build your sandwich</span>
    <strong>Start Building</strong>
  </button>
) : null}
```

Add CSS:

```css
.sticky-builder-bar {
  position: fixed;
  left: 50%;
  bottom: 86px;
  transform: translateX(-50%);
  width: calc(100% - 24px);
  max-width: 520px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 14px;
  border: 1px solid rgba(202, 138, 4, 0.32);
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary), #b91c1c);
  color: #fff;
  z-index: 90;
  box-shadow: 0 18px 38px rgba(127, 29, 29, 0.22);
}

.sticky-builder-bar span {
  font-size: 0.82rem;
  font-weight: 700;
}

.sticky-builder-bar strong {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

- [x] **Step 6: Run responsive home tests**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts
```

Expected result: pass after selectors and responsive assertions match the new hierarchy.

---

## Task 6: Update Builder View Presentation

**Files:**
- Modify: `platform/apps/storefront/app/page.tsx`
- Modify: `platform/apps/storefront/app/globals.css`
- Modify: `platform/tests/storefront/home.spec.ts`

- [ ] **Step 1: Update builder header copy**

In the builder view header, change:

```tsx
<p className="section-kicker">Customise your order</p>
```

to:

```tsx
<p className="section-kicker">Sandwich Builder</p>
```

- [ ] **Step 2: Strengthen builder view styling**

Add:

```css
.builder-header {
  padding: 22px;
  border: 1px solid rgba(202, 138, 4, 0.18);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(254, 243, 199, 0.72), transparent 42%),
    rgba(255, 253, 250, 0.84);
  box-shadow: 0 18px 42px rgba(127, 29, 29, 0.08);
}
```

- [ ] **Step 3: Verify builder CTA test**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts -g "primary homepage CTA opens the sandwich builder"
```

Expected result: pass and show the `Sandwich Builder` heading/kicker in the builder view.

---

## Task 7: Full Regression Verification

**Files:**
- Test: `platform/tests/storefront/home.spec.ts`
- Test: `platform/tests/storefront/order-flow.spec.ts`

- [ ] **Step 1: Run storefront Playwright tests**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts tests/storefront/order-flow.spec.ts
```

Expected result: all tests pass.

- [ ] **Step 2: Remove stale build output**

Run:

```powershell
Remove-Item -LiteralPath 'C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\.next' -Recurse -Force -ErrorAction SilentlyContinue
```

Expected result: command completes without requiring output.

- [ ] **Step 3: Build the storefront**

Run:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL='https://api.187.124.217.8.sslip.io/api'
$env:NEXT_PUBLIC_ADMIN_APP_URL='https://admin.187.124.217.8.sslip.io'
$env:NEXT_PUBLIC_STAFF_APP_URL='https://staff.187.124.217.8.sslip.io'
pnpm --filter @tuckinn/storefront build
```

Expected result: Next production build succeeds.

- [ ] **Step 4: Start local review server**

Run:

```powershell
pnpm --filter @tuckinn/storefront exec next start --hostname 0.0.0.0 --port 7000
```

Expected result: storefront is reviewable at `http://localhost:7000`.

---

## Self-Review

- Spec coverage: The plan covers hero hierarchy, route ordering, mobile CTA, builder preview, builder view styling, responsive behaviour, tests, and production build.
- Placeholder scan: No task relies on unfinished placeholder instructions.
- Type consistency: New props use `onStartBuilding` and `onBrowseFavourites` consistently in hero and page usage.
- Risk: The homepage sticky builder CTA must not appear over the basket CTA; the condition uses `basketCount === 0` to avoid that conflict.
