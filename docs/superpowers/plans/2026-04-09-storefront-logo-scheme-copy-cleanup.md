# Storefront Logo-Scheme Copy Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove instruction-style text from the storefront and restyle the homepage around the Tuckinn Proper logo colour scheme.

**Architecture:** Keep the current Next.js storefront structure, live API proxy, basket, checkout, and builder flow unchanged. Update customer-facing content in small components, then adjust global CSS variables and homepage surfaces to use logo-led red, black, white, and controlled warm neutrals.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Playwright, pnpm.

---

## Skills And Direction

Use these skills in this order:

- `test-driven-development`: Add failing assertions that instruction-style copy is gone before editing copy.
- `ui-ux-pro-max`: Apply logo-led premium food branding instead of generic ecommerce styling.
- `react-expert`: Keep component changes small and semantic.
- `playwright-expert`: Verify visible text, CTA behaviour, and responsive layout.
- `verification-before-completion`: Run homepage tests, order-flow tests, typecheck, and build.

Brand direction:

- Primary: Tuckinn red from the logo.
- Contrast: black and charcoal from the logo.
- Surface: white and off-white, not pale washed-out pink.
- Accent: use gold only sparingly, if at all; it should not overpower the logo.
- Copy tone: direct customer-facing food language, not UX/product-management language.

---

## Problem To Fix

The page currently includes text that sounds like internal instructions rather than customer-facing brand copy:

```text
Lunch-time confidence
Trusted for the lunch rush
The storefront should feel warm, fast, and dependable before anyone even reaches the basket.
```

Other examples to remove or rewrite:

```text
Guide people quickly into the route that matches how they want to order today.
Lead with the sections and items most likely to turn a quick visit into an order.
Why order here
Made for lunch that feels worth it
The storefront should...
```

These lines make the site feel unfinished because they describe what the design is trying to do instead of selling the food and ordering experience.

---

## File Structure

- Modify: `platform/apps/storefront/app/_storefront/social-proof.tsx`
  - Replace hardcoded instruction heading/body with customer-facing brand copy or remove the section heading if it adds clutter.

- Modify: `platform/apps/storefront/app/_storefront/content.ts`
  - Rewrite `trust`, `socialProof`, `support`, `basket.reassurance`, and `proof` copy so every line sounds like Tuckinn speaking to customers.

- Modify: `platform/apps/storefront/app/page.tsx`
  - Rewrite homepage `SectionShell` eyebrow/title/body props that currently sound like implementation notes.

- Modify: `platform/apps/storefront/app/globals.css`
  - Change CSS variables and homepage surfaces to match the logo: deeper black/charcoal contrast, stronger Tuckinn red, cleaner white cards, less washed-out pink.

- Modify: `platform/tests/storefront/home.spec.ts`
  - Add regression tests proving instruction-style text is not visible and logo-colour surfaces are applied.

---

## Task 1: Add Copy Cleanup Regression Test

**Files:**
- Modify: `platform/tests/storefront/home.spec.ts`

- [x] **Step 1: Add a test that bans instruction-style copy**

Add this test:

```ts
test("homepage removes internal instruction copy from customer-facing sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/The storefront should/i)).toHaveCount(0);
  await expect(page.getByText(/Guide people quickly/i)).toHaveCount(0);
  await expect(page.getByText(/Lead with the sections/i)).toHaveCount(0);
  await expect(page.getByText(/Why order here/i)).toHaveCount(0);
  await expect(page.getByText(/Lunch-time confidence/i)).toHaveCount(0);
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts -g "removes internal instruction copy"
```

Expected result: fail because `social-proof.tsx` and `page.tsx` still render internal copy.

---

## Task 2: Replace Instruction Copy With Customer-Facing Brand Copy

**Files:**
- Modify: `platform/apps/storefront/app/_storefront/social-proof.tsx`
- Modify: `platform/apps/storefront/app/page.tsx`
- Modify: `platform/apps/storefront/app/_storefront/content.ts`

- [x] **Step 1: Update `social-proof.tsx` section copy**

Replace:

```tsx
<p className="section-kicker">Lunch-time confidence</p>
<h2>Trusted for the lunch rush</h2>
<p>
  The storefront should feel warm, fast, and dependable before anyone even reaches the basket.
</p>
```

with:

```tsx
<p className="section-kicker">Great food, great mood</p>
<h2>Built for proper lunch orders</h2>
<p>
  Choose a favourite, build your own sandwich, and keep the order moving without menu noise.
</p>
```

- [x] **Step 2: Update homepage section copy in `page.tsx`**

Replace the `SectionShell` props:

```tsx
eyebrow="Start here"
title="Choose your lunch path"
body="Guide people quickly into the route that matches how they want to order today."
```

with:

```tsx
eyebrow="Order your way"
title="Start with the sandwich builder"
body="Build your sandwich first, or jump into ready-made favourites when you already know what you want."
```

Replace:

```tsx
eyebrow="Lunch favourites"
title="Popular around lunch"
body="Lead with the sections and items most likely to turn a quick visit into an order."
```

with:

```tsx
eyebrow="Tuckinn favourites"
title="Popular picks ready fast"
body="Ready-made lunches stay close for customers who want something proper without building from scratch."
```

Replace:

```tsx
eyebrow="Why order here"
title="Made for lunch that feels worth it"
body="Fresh deli favourites, faster ordering, and made-to-order flexibility without the usual menu friction."
```

with:

```tsx
eyebrow="Great food, great mood"
title="Proper lunch, built around you"
body="Fresh favourites, custom sandwiches, and a direct ordering flow that keeps the focus on the food."
```

- [x] **Step 3: Rewrite supporting content**

Update `storefrontContent.trust`:

```ts
trust: [
  "Build your own sandwich",
  "Fresh Tuckinn favourites",
  "Fast collection and delivery"
]
```

Update `storefrontContent.socialProof`:

```ts
socialProof: [
  {
    eyebrow: "Signature builder",
    title: "Make it your way",
    body: "Choose the bread, fillings, salad, and sauce before it reaches the basket."
  },
  {
    eyebrow: "Proper favourites",
    title: "Ready when you are",
    body: "Popular Tuckinn picks stay easy to find for fast lunch decisions."
  },
  {
    eyebrow: "Direct ordering",
    title: "No menu maze",
    body: "Clear choices and strong actions keep customers moving from craving to checkout."
  }
]
```

Update `storefrontContent.proof`:

```ts
proof: [
  {
    title: "The builder is the difference",
    body: "Customers can create the sandwich they actually want instead of settling for a fixed menu item."
  },
  {
    title: "Favourites still stay fast",
    body: "Ready-made Tuckinn picks remain close for regulars who want speed over customisation."
  },
  {
    title: "A proper branded order",
    body: "The experience should feel like Tuckinn from first tap to basket, not a generic takeaway template."
  }
]
```

- [x] **Step 4: Rerun the copy cleanup test**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts -g "removes internal instruction copy"
```

Expected result: pass.

---

## Task 3: Apply Logo Colour Scheme

**Files:**
- Modify: `platform/apps/storefront/app/globals.css`

- [x] **Step 1: Update CSS variables**

Change root variables toward the logo palette:

```css
:root {
  --primary: #d71920;
  --primary-strong: #8f0f14;
  --primary-soft: #f04b52;
  --accent: #111111;
  --accent-soft: #f7f2ed;
  --primary-glow: rgba(215, 25, 32, 0.26);
  --bg: #f7f2ed;
  --bg-alt: #ffffff;
  --bg-card: rgba(255, 255, 255, 0.94);
  --bg-card-strong: #ffffff;
  --bg-input: rgba(17, 17, 17, 0.05);
  --text: #170c0c;
  --text-muted: rgba(23, 12, 12, 0.72);
  --text-dim: rgba(23, 12, 12, 0.5);
  --border: rgba(17, 17, 17, 0.11);
  --border-light: rgba(215, 25, 32, 0.22);
}
```

- [x] **Step 2: Make header and cards use logo contrast**

Update key surfaces:

```css
.app-header-shell {
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid rgba(17, 17, 17, 0.1);
}

.drawer-trigger,
.primary-action,
.sticky-builder-bar {
  background: linear-gradient(135deg, #d71920, #8f0f14);
}

.builder-preview-card,
.order-path-card-primary {
  border-color: rgba(215, 25, 32, 0.24);
}
```

- [x] **Step 3: Reduce washed-out pink**

Update `body` and `.storefront-app` backgrounds to use a white/cream base with red as controlled accent:

```css
body {
  background:
    radial-gradient(circle at top left, rgba(215, 25, 32, 0.12), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f7f2ed 42%, #ffffff 100%);
}

.storefront-app {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(247, 242, 237, 0.78));
}
```

- [x] **Step 4: Add logo colour test**

Add to `home.spec.ts`:

```ts
test("homepage uses the logo-led red black and white palette", async ({ page }) => {
  await page.goto("/");

  const primaryButton = page.getByRole("button", { name: "Start Building" });
  await expect(primaryButton).toBeVisible();

  const styles = await primaryButton.evaluate(element => {
    const computed = window.getComputedStyle(element);
    return {
      background: computed.backgroundImage,
      color: computed.color
    };
  });

  expect(styles.background).toContain("rgb(215, 25, 32)");
  expect(styles.color).toBe("rgb(255, 255, 255)");
});
```

- [x] **Step 5: Run homepage tests**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts
```

Expected result: all homepage tests pass.

---

## Task 4: Visual Review And Full Verification

**Files:**
- Test: `platform/tests/storefront/home.spec.ts`
- Test: `platform/tests/storefront/order-flow.spec.ts`

- [x] **Step 1: Capture desktop and mobile screenshots**

Run:

```powershell
pnpm exec playwright screenshot --viewport-size="390,844" http://localhost:7000 test-results/logo-copy-cleanup-mobile.png
pnpm exec playwright screenshot --viewport-size="1280,900" http://localhost:7000 test-results/logo-copy-cleanup-desktop.png
```

Expected result: screenshots show no internal instruction copy, stronger logo-led red/black/white palette, and clear builder-first hierarchy.

- [x] **Step 2: Run homepage tests**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts
```

Expected result: all homepage tests pass.

- [x] **Step 3: Run order-flow tests through local API proxy**

Run:

```powershell
$env:PLAYWRIGHT_API_URL='http://127.0.0.1:4105/api'
pnpm exec playwright test tests/storefront/order-flow.spec.ts
```

Expected result: order flow still passes.

- [x] **Step 4: Typecheck and build**

Run:

```powershell
pnpm --filter @tuckinn/storefront typecheck
Remove-Item -LiteralPath 'C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\.next' -Recurse -Force -ErrorAction SilentlyContinue
pnpm --filter @tuckinn/storefront build
```

Expected result: typecheck and production build pass.

---

## Acceptance Criteria

- No visible copy says `The storefront should`, `Guide people`, `Lead with`, or `Lunch-time confidence`.
- Customer-facing sections sound like food/order copy, not design instructions.
- The homepage palette clearly follows the logo: red, black/charcoal, white, and restrained warm neutral.
- The sandwich builder remains the primary homepage action.
- `localhost:7000` still loads live catalog data through the local `/api` proxy.
- Homepage tests, order-flow tests, typecheck, and build pass.
