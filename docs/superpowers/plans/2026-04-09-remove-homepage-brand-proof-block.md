# Remove Homepage Brand Proof Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the homepage proof block that starts with `Great food, great mood` and includes `Proper lunch, built around you`, `The builder is the difference`, `Favourites still stay fast`, and `A proper branded order`.

**Architecture:** Keep the builder-first hero, trust strip, social proof, route cards, featured items, menu overview, basket, checkout, and live API proxy unchanged. Remove only the duplicated brand-proof section and its now-unused component/data/imports so the homepage feels cleaner and less text-heavy.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Playwright, pnpm.

---

## Skills And Decision

Use these skills in this order:

- `test-driven-development`: Add failing assertions that the block is gone before removing code.
- `ui-ux-pro-max`: Apply a leaner conversion page structure: hero, trust, direct routes, product proof, menu.
- `react-expert`: Remove unused component imports and dead code cleanly.
- `playwright-expert`: Update homepage assertions and verify responsive layout still works.
- `verification-before-completion`: Run homepage tests, order-flow tests, typecheck, and build.

Decision:

- Delete the whole `BrandProof` section rather than rewriting it.
- Keep `Great food, great mood` in `social-proof.tsx` only if it remains outside the quoted block and still feels acceptable; the quoted block in `page.tsx` must be removed.
- Remove dead `BrandProof` import and component file if no other code uses it.
- Remove `storefrontContent.proof` if no other component uses it.
- Remove unused `quickCount`, `customCount`, and `categoryCount` calculations only if they become unused after deleting the section.

---

## Current Source Of The Block

The quoted block is rendered from:

- `platform/apps/storefront/app/page.tsx`
  - `SectionShell` with:
    - `eyebrow="Great food, great mood"`
    - `title="Proper lunch, built around you"`
    - `body="Fresh favourites, custom sandwiches, and a direct ordering flow that keeps the focus on the food."`
  - Child component: `<BrandProof quickCount={quickCount} customCount={customCount} categoryCount={categories.length} />`

- `platform/apps/storefront/app/_storefront/brand-proof.tsx`
  - Renders labels:
    - `Quick lunch picks`
    - `Clear menu sections`
    - `Made-to-order options`

- `platform/apps/storefront/app/_storefront/content.ts`
  - `storefrontContent.proof` renders:
    - `The builder is the difference`
    - `Favourites still stay fast`
    - `A proper branded order`

---

## Task 1: Add Removal Regression Test

**Files:**
- Modify: `platform/tests/storefront/home.spec.ts`

- [x] **Step 1: Add a test that the quoted block is gone**

Add this test:

```ts
test("homepage removes the duplicated brand proof block", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Build your proper sandwich/i })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Proper lunch, built around you" })).toHaveCount(0);
  await expect(page.getByText("Fresh favourites, custom sandwiches, and a direct ordering flow that keeps the focus on the food.")).toHaveCount(0);
  await expect(page.getByText("Quick lunch picks")).toHaveCount(0);
  await expect(page.getByText("Clear menu sections")).toHaveCount(0);
  await expect(page.getByText("Made-to-order options")).toHaveCount(0);
  await expect(page.getByText("The builder is the difference")).toHaveCount(0);
  await expect(page.getByText("Favourites still stay fast")).toHaveCount(0);
  await expect(page.getByText("A proper branded order")).toHaveCount(0);
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts -g "duplicated brand proof block"
```

Expected result: fail because the block is currently visible.

---

## Task 2: Remove The Brand Proof Section

**Files:**
- Modify: `platform/apps/storefront/app/page.tsx`
- Modify: `platform/tests/storefront/home.spec.ts`

- [x] **Step 1: Remove the `BrandProof` import**

Delete this line:

```ts
import { BrandProof } from "./_storefront/brand-proof";
```

- [x] **Step 2: Remove the homepage `BrandProof` section**

Delete this full block:

```tsx
<SectionShell
  eyebrow="Great food, great mood"
  title="Proper lunch, built around you"
  body="Fresh favourites, custom sandwiches, and a direct ordering flow that keeps the focus on the food."
>
  <BrandProof
    quickCount={quickCount}
    customCount={customCount}
    categoryCount={categories.length}
  />
</SectionShell>
```

- [x] **Step 3: Remove old positive assertions**

In `platform/tests/storefront/home.spec.ts`, remove these existing assertions from `homepage shows the premium conversion entry points`:

```ts
await expect(page.getByRole("heading", { name: "Proper lunch, built around you" })).toBeVisible();
await expect(page.getByText("The builder is the difference")).toBeVisible();
await expect(page.getByText("Favourites still stay fast")).toBeVisible();
await expect(page.getByText("A proper branded order")).toBeVisible();
```

- [x] **Step 4: Run focused test**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts -g "duplicated brand proof block"
```

Expected result: pass.

---

## Task 3: Remove Dead Component/Data If Unused

**Files:**
- Delete if unused: `platform/apps/storefront/app/_storefront/brand-proof.tsx`
- Modify: `platform/apps/storefront/app/_storefront/content.ts`
- Modify: `platform/apps/storefront/app/page.tsx`
- Modify: `platform/apps/storefront/app/globals.css`

- [x] **Step 1: Search for remaining `BrandProof` usage**

Run:

```powershell
rg "BrandProof|brand-proof|storefrontContent.proof|quickCount|customCount|categoryCount" platform/apps/storefront/app platform/tests/storefront
```

Expected result: only the component file, content `proof`, CSS classes, and unused calculations should remain.

- [x] **Step 2: Delete `brand-proof.tsx` if no imports remain**

Delete:

```text
platform/apps/storefront/app/_storefront/brand-proof.tsx
```

- [x] **Step 3: Remove `storefrontContent.proof`**

In `content.ts`, delete:

```ts
proof: [
  {
    title: "The builder is the difference",
    body: "The order feels like Tuckinn from first tap to basket, not a generic takeaway template."
  }
]
```

Delete the entire `proof` array, including all three objects, and ensure the object syntax remains valid.

- [x] **Step 4: Remove unused counts from `page.tsx`**

If TypeScript reports them unused, remove:

```ts
const quickCount = categories.reduce(...);
const customCount = categories.reduce(...);
```

Keep `activeCategoryQuickCount` and `activeCategoryCustomCount` because the menu view may still use them.

- [x] **Step 5: Leave CSS in place unless type/build flags it**

CSS classes such as `.brand-proof-grid` are harmless but unused. Remove them only if doing so is quick and does not risk touching unrelated layout.

- [x] **Step 6: Run typecheck**

Run:

```powershell
pnpm --filter @tuckinn/storefront typecheck
```

Expected result: pass with no unused TypeScript symbols.

---

## Task 4: Verify Homepage Flow Still Feels Complete

**Files:**
- Test: `platform/tests/storefront/home.spec.ts`
- Test: `platform/tests/storefront/order-flow.spec.ts`

- [x] **Step 1: Run homepage tests**

Run:

```powershell
pnpm exec playwright test tests/storefront/home.spec.ts
```

Expected result: all homepage tests pass.

- [x] **Step 2: Run order-flow tests through local API proxy**

Run:

```powershell
$env:PLAYWRIGHT_API_URL='http://127.0.0.1:4105/api'
pnpm exec playwright test tests/storefront/order-flow.spec.ts
```

Expected result: both order-flow tests pass.

- [x] **Step 3: Production build**

Run safely:

```powershell
Remove-Item -LiteralPath 'C:\Users\steph\OneDrive\Desktop\tuckinn p new\platform\apps\storefront\.next' -Recurse -Force -ErrorAction SilentlyContinue
pnpm --filter @tuckinn/storefront build
```

Expected result: build passes.

- [x] **Step 4: Restart local review server**

Run:

```powershell
pnpm --filter @tuckinn/storefront exec next dev --hostname 0.0.0.0 --port 7000
```

Expected result: review remains available at `http://localhost:7000`.

---

## Acceptance Criteria

- The quoted `Great food, great mood / Proper lunch, built around you` block is gone from the homepage.
- The three proof cards with `Quick lunch picks`, `Clear menu sections`, and `Made-to-order options` are gone.
- The homepage still has enough structure: hero, trust strip, social proof, order paths, featured favourites, menu overview, support notes.
- The sandwich builder remains the primary visual and conversion focus.
- Homepage tests, order-flow tests, typecheck, and production build pass.
