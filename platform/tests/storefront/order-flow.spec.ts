import { expect, test } from "@playwright/test";

type CatalogResponse = {
  categories: Array<{
    id: string;
    name: string;
    products: Array<{
      id: string;
      name: string;
      modifierGroups: Array<{ id: string }>;
    }>;
  }>;
};

const apiBaseUrl = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3200/api";

test("customer can add a ready-made item to the basket from the live menu", async ({
  page,
  request
}) => {
  const catalogResponse = await request.get(
    `${apiBaseUrl}/catalog/public?locationCode=main`
  );
  expect(catalogResponse.ok()).toBeTruthy();

  const catalog = (await catalogResponse.json()) as CatalogResponse;
  const categoryWithReadyMadeItem = catalog.categories.find(category =>
    category.products.some(product => product.modifierGroups.length === 0)
  );
  expect(categoryWithReadyMadeItem).toBeTruthy();

  const readyMadeProduct = categoryWithReadyMadeItem!.products.find(
    product => product.modifierGroups.length === 0
  );
  expect(readyMadeProduct).toBeTruthy();

  await page.goto("/");
  await page.getByRole("button", { name: "Browse The Menu" }).click();

  await expect(
    page.getByRole("heading", { name: categoryWithReadyMadeItem!.name, level: 1 })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fast lunch favourites first" })
  ).toBeVisible();
  await expect(
    page.getByText(/Ready-made picks stay first for a faster lunch/i)
  ).toBeVisible();
  await expect(page.getByText(/customers can order faster/i)).toHaveCount(0);

  const productRow = page.locator("article").filter({ hasText: readyMadeProduct!.name });
  await expect(productRow).toBeVisible();
  await productRow.getByRole("button", { name: "Add to basket" }).click();
  await expect(productRow.getByRole("button", { name: "Added" })).toBeVisible();
  await expect(page.getByRole("button", { name: /View basket/i })).toBeVisible();

  await page.getByRole("button", { name: /View basket/i }).click();

  await expect(page.getByRole("heading", { name: "Basket" })).toBeVisible();
  await expect(page.getByText(readyMadeProduct!.name)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your details" })).toBeVisible();
  await expect(page.getByText("Kitchen notes", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customer details" })).toHaveCount(0);
  await expect(page.getByText("Special instructions", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Add special instructions for the kitchen.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Proceed to Payment" })).toBeEnabled();
});

test("delivery checkout asks for a delivery address before payment", async ({
  page,
  request
}) => {
  const catalogResponse = await request.get(
    `${apiBaseUrl}/catalog/public?locationCode=main`
  );
  expect(catalogResponse.ok()).toBeTruthy();

  const catalog = (await catalogResponse.json()) as CatalogResponse;
  const categoryWithReadyMadeItem = catalog.categories.find(category =>
    category.products.some(product => product.modifierGroups.length === 0)
  );
  expect(categoryWithReadyMadeItem).toBeTruthy();

  const readyMadeProduct = categoryWithReadyMadeItem!.products.find(
    product => product.modifierGroups.length === 0
  );
  expect(readyMadeProduct).toBeTruthy();

  await page.goto("/");
  await page.getByRole("button", { name: "Browse The Menu" }).click();

  const productRow = page.locator("article").filter({ hasText: readyMadeProduct!.name });
  await productRow.getByRole("button", { name: "Add to basket" }).click();
  await page.getByRole("button", { name: /View basket/i }).click();

  await expect(page.getByText("Address line 1")).toHaveCount(0);

  await page.getByLabel("Order type").selectOption("delivery");

  await expect(page.getByRole("heading", { name: "Delivery address" })).toBeVisible();
  await expect(page.getByLabel("Address line 1")).toBeVisible();
  await expect(page.getByLabel("Address line 2")).toBeVisible();
  await expect(page.getByLabel("Town or city")).toBeVisible();
  await expect(page.getByLabel("Postcode")).toBeVisible();

  await page.getByLabel("Address line 1").fill("12 Market Street");
  await page.getByLabel("Address line 2").fill("Flat 3");
  await page.getByLabel("Town or city").fill("Dublin");
  await page.getByLabel("Postcode").fill("D02 XY12");

  await page.getByLabel("Order type").selectOption("collect");
  await expect(page.getByRole("heading", { name: "Delivery address" })).toHaveCount(0);
});

test("customer gets guided builder steps and add-on suggestions before checkout", async ({
  page,
  request
}) => {
  const catalogResponse = await request.get(
    `${apiBaseUrl}/catalog/public?locationCode=main`
  );
  expect(catalogResponse.ok()).toBeTruthy();

  const catalog = (await catalogResponse.json()) as CatalogResponse;
  const hasCustomProduct = catalog.categories.some(category =>
    category.products.some(product => product.modifierGroups.length > 0)
  );
  const hasQuickPick = catalog.categories.some(category =>
    category.products.some(product => product.modifierGroups.length === 0)
  );

  expect(hasCustomProduct).toBeTruthy();
  expect(hasQuickPick).toBeTruthy();

  await page.goto("/");
  await page.getByRole("button", { name: "Build A Sandwich" }).click();

  await expect(page.getByText(/Step 1 of \d+/i)).toBeVisible();
  await expect(
    page.getByText(/Choose the essentials first\. You can review everything before adding it\./i)
  ).toBeVisible();

  const nextStepButton = page.getByRole("button", { name: "Next step" });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!(await nextStepButton.isVisible().catch(() => false))) {
      break;
    }
    await nextStepButton.click();
  }

  await page.getByRole("button", { name: "Add to order" }).click();
  await page.getByRole("button", { name: /View basket/i }).click();

  await expect(page.getByRole("heading", { name: "Add something extra" })).toBeVisible();
  await expect(
    page.getByText(/You can still add a quick side or drink before payment\./i)
  ).toBeVisible();
  await expect(
    page.locator(".basket-upsells").getByRole("button", { name: "Add to basket" }).first()
  ).toBeVisible();
});
