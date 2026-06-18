import { expect, test } from "@playwright/test";

test("loads the Phase 0 scaffold", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /e-commerce operations dashboard/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/phase 0 foundation/i)).toBeVisible();
  await expect(page.getByText(/mock-first local development/i)).toBeVisible();
});
