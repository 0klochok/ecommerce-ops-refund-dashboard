import { expect, test } from "@playwright/test";

test("supports the Phase 2 refund dashboard interaction path", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /refund operations dashboard/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/total refunded/i)).toBeVisible();
  await expect(
    page.getByText(/interactive refund operations queue/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /rfnd_demo_1001/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", {
      name: /selected refund detail/i,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /close refund detail panel/i,
    }),
  ).toHaveCount(0);

  await page.getByLabel(/search refunds/i).fill("ord-1042");
  await expect(
    page.getByRole("cell", { name: /guest checkout b/i }),
  ).toBeVisible();
  await expect(page.getByText(/returning customer a/i)).toHaveCount(0);

  await page.getByRole("button", { name: /reset/i }).click();
  await page.getByLabel(/^status$/i).selectOption("pending_review");
  await page.getByLabel(/^channel$/i).selectOption("Stripe test");
  await expect(
    page.getByRole("cell", { name: /subscription shopper e/i }),
  ).toBeVisible();
  await expect(page.getByText(/guest checkout b/i)).toHaveCount(0);

  await page.getByRole("button", { name: /reset/i }).click();
  await expect(page.getByLabel(/^risk$/i)).toBeVisible();
  await page.getByLabel(/^risk$/i).selectOption("urgent-high-risk");
  await expect(page.getByText(/showing 3 of 7 refund records/i)).toBeVisible();
  await expect(
    page.getByRole("cell", { name: /returning customer a/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: /wholesale buyer c/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: /subscription shopper e/i }),
  ).toBeVisible();
  await expect(page.getByText(/guest checkout b/i)).toHaveCount(0);

  await page.getByRole("button", { name: /reset/i }).click();
  await page.getByLabel(/^sort$/i).selectOption("amount-desc");
  await expect(
    page.getByRole("button", { name: /rfnd_demo_/i }).first(),
  ).toContainText("rfnd_demo_1003");

  await page
    .getByRole("button", {
      name: /rfnd_demo_1005/i,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: /rfnd_demo_1005/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", {
      name: /selected refund detail/i,
    }),
  ).toBeVisible();
  const closeButton = page.getByRole("button", {
    name: /close refund detail panel/i,
  });
  await expect(closeButton).toHaveText("X");
  await closeButton.click();
  await expect(
    page.getByRole("complementary", {
      name: /selected refund detail/i,
    }),
  ).toHaveCount(0);

  await page.getByLabel(/^sort$/i).selectOption("created-asc");
  await page.getByLabel(/^risk$/i).selectOption("urgent-high-risk");
  await page.getByRole("button", { name: /reset/i }).click();
  await expect(
    page.getByRole("complementary", {
      name: /selected refund detail/i,
    }),
  ).toHaveCount(0);

  await page
    .getByRole("button", {
      name: /rfnd_demo_1003/i,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: /rfnd_demo_1003/i,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: /rfnd_demo_1001/i,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: /rfnd_demo_1001/i,
    }),
  ).toBeVisible();
  await page.getByLabel(/^sort$/i).selectOption("amount-desc");
  await expect(
    page.getByRole("heading", {
      name: /rfnd_demo_1001/i,
    }),
  ).toBeVisible();

  await page.getByLabel(/search refunds/i).fill("not-a-real-refund");
  await expect(
    page.getByText(/no refunds match the current filters/i),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", {
      name: /selected refund detail/i,
    }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: /clear filters/i }).click();
  await expect(
    page.getByRole("button", {
      name: /rfnd_demo_1001/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", {
      name: /selected refund detail/i,
    }),
  ).toHaveCount(0);
});
