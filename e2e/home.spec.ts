import { expect, test } from "@playwright/test";

test("loads the Phase 1 refund dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /refund operations dashboard/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/total refunded/i)).toBeVisible();
  await expect(page.getByText(/refund operations queue/i)).toBeVisible();
  await expect(page.getByText(/rfnd_demo_1001/i)).toBeVisible();
});
