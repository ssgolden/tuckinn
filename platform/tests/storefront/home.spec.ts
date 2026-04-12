import { expect, test } from "@playwright/test";

test("homepage shows the premium conversion entry points", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Tuckinn Proper \| Fresh Lunch, Fast Ordering/i);
  await expect(
    page.getByRole("heading", { name: /Build your proper sandwich/i })
  ).toBeVisible();
  await expect(
    page.getByText(/guided builder, then check out without losing the quick lunch pace/i)
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Start Building" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Browse Favourites" })).toBeVisible();
  const routeCards = page.locator(".order-path-card");
  await expect(routeCards.first()).toContainText("Build A Sandwich");
  await expect(routeCards.first()).toContainText("Signature route");
  await expect(routeCards.first()).toHaveClass(/order-path-card-primary/);
  await expect(page.getByRole("button", { name: "Browse The Menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Meal Deals" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Build A Sandwich" })).toBeVisible();
  const trustStrip = page.locator(".trust-strip");
  await expect(trustStrip.getByText("Build your own sandwich", { exact: true })).toBeVisible();
  await expect(trustStrip.getByText("Fresh Tuckinn favourites", { exact: true })).toBeVisible();
  await expect(trustStrip.getByText("Fast collection and delivery", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Built for proper lunch orders" })).toBeVisible();
  await expect(page.getByText("Make it your way")).toBeVisible();
  await expect(page.getByText("Order fast")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start with the sandwich builder" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Popular picks ready fast" })).toBeVisible();
});

test("primary homepage CTA opens the sandwich builder", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Start Building" }).click();

  await expect(page.getByRole("heading", { name: /Sandwich Builder/i })).toBeVisible();
  await expect(page.locator(".builder-view")).toBeVisible();
});

test("homepage removes internal instruction copy from customer-facing sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Build your proper sandwich/i })).toBeVisible();

  await expect(page.getByText(/The storefront should/i)).toHaveCount(0);
  await expect(page.getByText(/Guide people quickly/i)).toHaveCount(0);
  await expect(page.getByText(/Lead with the sections/i)).toHaveCount(0);
  await expect(page.getByText(/Why order here/i)).toHaveCount(0);
  await expect(page.getByText(/Lunch-time confidence/i)).toHaveCount(0);
  await expect(page.getByText(/should feel|should stay/i)).toHaveCount(0);
});

test("homepage removes the duplicated brand proof block", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Build your proper sandwich/i })).toBeVisible();

  await expect(page.getByRole("heading", { name: "Proper lunch, built around you" })).toHaveCount(0);
  await expect(
    page.getByText(
      "Fresh favourites, custom sandwiches, and a direct ordering flow that keeps the focus on the food."
    )
  ).toHaveCount(0);
  await expect(page.getByText("Quick lunch picks")).toHaveCount(0);
  await expect(page.getByText("Clear menu sections")).toHaveCount(0);
  await expect(page.getByText("Made-to-order options")).toHaveCount(0);
  await expect(page.getByText("The builder is the difference")).toHaveCount(0);
  await expect(page.getByText("Favourites still stay fast")).toHaveCount(0);
  await expect(page.getByText("A proper branded order")).toHaveCount(0);
});

test("homepage removes low-value instruction copy", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Build your proper sandwich/i })).toBeVisible();

  await expect(
    page.getByText(
      "Ready-made lunches stay close for customers who want something proper without building from scratch."
    )
  ).toHaveCount(0);
  await expect(page.getByText("Simple reminders")).toHaveCount(0);
  await expect(page.getByText("Simple ordering notes")).toHaveCount(0);
  await expect(page.getByText("1. Build your sandwich if you want it made your way.")).toHaveCount(0);
  await expect(page.getByText("2. Choose favourites when you want lunch fast.")).toHaveCount(0);
  await expect(page.getByText("3. Review your basket before checkout.")).toHaveCount(0);
  await expect(page.getByText("then checkout.")).toHaveCount(0);
  await expect(page.getByText(/customers/i)).toHaveCount(0);
});

test("homepage gives the sandwich builder a premium visual treatment", async ({ page }) => {
  await page.goto("/");

  const builderPreviewCard = page.locator(".builder-preview-card");
  const signatureRouteCard = page.locator(".order-path-card-primary");

  await expect(builderPreviewCard).toBeVisible();
  await expect(signatureRouteCard).toBeVisible();

  const previewStyles = await builderPreviewCard.evaluate(element => {
    const styles = window.getComputedStyle(element);
    return {
      background: styles.backgroundImage,
      borderRadius: Number.parseFloat(styles.borderRadius),
      boxShadow: styles.boxShadow,
      padding: Number.parseFloat(styles.paddingTop)
    };
  });

  expect(previewStyles.background).toContain("gradient");
  expect(previewStyles.borderRadius).toBeGreaterThanOrEqual(24);
  expect(previewStyles.boxShadow).not.toBe("none");
  expect(previewStyles.padding).toBeGreaterThanOrEqual(22);

  const routeStyles = await signatureRouteCard.evaluate(element => {
    const styles = window.getComputedStyle(element);
    return {
      background: styles.backgroundImage,
      borderRadius: Number.parseFloat(styles.borderRadius),
      boxShadow: styles.boxShadow
    };
  });

  expect(routeStyles.background).toContain("gradient");
  expect(routeStyles.borderRadius).toBeGreaterThanOrEqual(22);
  expect(routeStyles.boxShadow).not.toBe("none");
});

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

test("homepage uses responsive premium foundations across mobile tablet and laptop", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const mobileBrowseButton = page.getByRole("button", { name: "Browse", exact: true });
  const mobileButtonBox = await mobileBrowseButton.boundingBox();
  expect(mobileButtonBox).not.toBeNull();
  expect(mobileButtonBox!.height).toBeGreaterThanOrEqual(44);
  expect(mobileButtonBox!.width).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ width: 820, height: 1180 });
  await page.reload();

  await expect(page.getByText(/Order online|in basket/i)).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.reload();

  const heroBox = await page.locator(".hero").boundingBox();
  expect(heroBox).not.toBeNull();
  expect(heroBox!.width).toBeLessThan(1320);
});

test("homepage shifts from mobile-first stacking to richer large-screen composition", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const mobileHeroContent = await page.locator(".hero-content").boundingBox();
  const mobileBuilderPreview = await page.locator(".builder-preview").boundingBox();
  const mobileRouteCards = page.locator(".order-path-card");
  const mobileFirstCard = await mobileRouteCards.nth(0).boundingBox();
  const mobileSecondCard = await mobileRouteCards.nth(1).boundingBox();

  expect(mobileHeroContent).not.toBeNull();
  expect(mobileBuilderPreview).not.toBeNull();
  expect(Math.abs(mobileBuilderPreview!.x - mobileHeroContent!.x)).toBeLessThan(24);
  expect(mobileBuilderPreview!.y).toBeGreaterThan(mobileHeroContent!.y + mobileHeroContent!.height - 16);

  expect(mobileFirstCard).not.toBeNull();
  expect(mobileSecondCard).not.toBeNull();
  expect(Math.abs(mobileFirstCard!.x - mobileSecondCard!.x)).toBeLessThan(12);
  expect(mobileSecondCard!.y).toBeGreaterThan(mobileFirstCard!.y + mobileFirstCard!.height - 4);

  await page.setViewportSize({ width: 820, height: 1180 });
  await page.reload();

  const tabletFirstCard = await mobileRouteCards.nth(0).boundingBox();
  const tabletSecondCard = await mobileRouteCards.nth(1).boundingBox();

  expect(tabletFirstCard).not.toBeNull();
  expect(tabletSecondCard).not.toBeNull();
  expect(tabletFirstCard!.width).toBeGreaterThan(tabletSecondCard!.width + 40);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();

  const heroContent = await page.locator(".hero-content").boundingBox();
  const heroBrand = await page.locator(".hero-brand").boundingBox();
  const desktopFirstCard = await mobileRouteCards.nth(0).boundingBox();
  const desktopSecondCard = await mobileRouteCards.nth(1).boundingBox();

  expect(heroContent).not.toBeNull();
  expect(heroBrand).not.toBeNull();
  expect(heroBrand!.x).toBeGreaterThan(heroContent!.x + 80);
  expect(Math.abs(heroBrand!.y - heroContent!.y)).toBeLessThan(80);

  expect(desktopFirstCard).not.toBeNull();
  expect(desktopSecondCard).not.toBeNull();
  expect(Math.abs(desktopFirstCard!.y - desktopSecondCard!.y)).toBeLessThan(24);
  expect(desktopSecondCard!.x).toBeGreaterThan(desktopFirstCard!.x + 40);
});
