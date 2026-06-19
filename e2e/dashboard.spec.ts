import { expect, test } from "@playwright/test";

test("supports the dashboard overview and orders workflow", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /business-value operations overview/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("Gross revenue", { exact: true })).toBeVisible();
  await expect(page.getByText("Refund rate", { exact: true })).toBeVisible();
  await expect(page.getByTestId("revenue-refund-chart")).toBeVisible();
  await expect(
    page.getByText(/runtime error|build error|unhandled runtime error/i),
  ).toHaveCount(0);

  await page.getByRole("link", { name: /^orders$/i }).click();

  await expect(
    page.getByRole("heading", {
      name: /orders queue/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", {
      name: /orders with customer/i,
    }),
  ).toBeVisible();

  await page
    .getByLabel(/search orders by order number, customer, or email/i)
    .fill("ORD-DEMO-00017");
  await expect(page.getByRole("cell", { name: /ord-demo-00017/i })).toBeVisible();

  await page.getByLabel(/payment filter/i).click();
  await page.getByRole("option", { name: /^failed$/i }).click();
  await expect(page.getByRole("cell", { name: /ord-demo-00017/i })).toBeVisible();
  await expect(page.getByText(/showing 1 of 1 matching orders/i)).toBeVisible();

  await page.getByRole("link", { name: /^view$/i }).click();

  await expect(
    page.getByRole("heading", {
      name: /ord-demo-00017/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /order summary/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /line items/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toContainText(/travel|desk|cable|cube|notebook|bundle/i);
  await expect(
    page.getByRole("heading", {
      name: /payment, refund, and dispute records/i,
    }),
  ).toBeVisible();
});
