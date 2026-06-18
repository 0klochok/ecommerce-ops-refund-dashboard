import { expect, test, type Page } from "@playwright/test";

type LayoutBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

async function getRefundControlsBox(page: Page): Promise<LayoutBox> {
  const controls = page.getByRole("region", {
    name: /refund table controls/i,
  });

  await expect(controls).toBeVisible();
  return controls.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      height: rect.height,
      width: rect.width,
      x: rect.x + window.scrollX,
      y: rect.y + window.scrollY,
    };
  });
}

async function expectRefundControlsLayoutStable(
  page: Page,
  before: LayoutBox,
) {
  const after = await getRefundControlsBox(page);
  const tolerance = 2;

  expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(tolerance);
  await expect(page.getByLabel(/search refunds/i)).toBeVisible();
  await expect(page.getByLabel(/status filter/i)).toBeEnabled();
  await expect(page.getByLabel(/channel filter/i)).toBeEnabled();
  await expect(page.getByLabel(/risk filter/i)).toBeEnabled();
}

test("supports the Phase 2 refund dashboard interaction path", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /refund operations dashboard/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/runtime error|build error|unhandled runtime error/i),
  ).toHaveCount(0);
  await expect(page.getByText(/total refunded/i)).toBeVisible();
  await expect(
    page.locator("article").filter({ hasText: /urgent \/ high risk/i }),
  ).toContainText("3");
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
  await expect(
    page.getByRole("region", {
      name: /refund table controls/i,
    }),
  ).toBeVisible();

  await page.getByLabel(/search refunds/i).fill("ord-1042");
  await expect(
    page.getByRole("cell", { name: /guest checkout b/i }),
  ).toBeVisible();
  await expect(page.getByText(/returning customer a/i)).toHaveCount(0);

  await page.getByRole("button", { name: /reset/i }).click();
  await page.getByLabel(/status filter/i).selectOption("pending_review");
  await page.getByLabel(/channel filter/i).selectOption("Stripe test");
  await expect(
    page.getByRole("cell", { name: /subscription shopper e/i }),
  ).toBeVisible();
  await expect(page.getByText(/guest checkout b/i)).toHaveCount(0);

  await page.getByRole("button", { name: /reset/i }).click();
  await expect(page.getByLabel(/risk filter/i)).toBeVisible();
  await page.getByLabel(/risk filter/i).selectOption("urgent-high-risk");
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
  await page.getByLabel(/sort refund table/i).selectOption("amount-desc");
  await expect(
    page.getByRole("button", { name: /rfnd_demo_/i }).first(),
  ).toContainText("rfnd_demo_1003");
  await page.getByLabel(/sort refund table/i).selectOption("amount-asc");
  await expect(
    page.getByRole("button", { name: /rfnd_demo_/i }).first(),
  ).toContainText("rfnd_demo_1006");
  await page.getByLabel(/sort refund table/i).selectOption("created-asc");
  await expect(
    page.getByRole("button", { name: /rfnd_demo_/i }).first(),
  ).toContainText("rfnd_demo_1007");
  await page.getByLabel(/sort refund table/i).selectOption("created-desc");
  await expect(
    page.getByRole("button", { name: /rfnd_demo_/i }).first(),
  ).toContainText("rfnd_demo_1001");

  const controlsBoxBeforeRowClick = await getRefundControlsBox(page);

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
  await expectRefundControlsLayoutStable(page, controlsBoxBeforeRowClick);

  const closeButton = page.getByRole("button", {
    name: /close refund detail panel/i,
  });
  await expect(closeButton).toHaveAccessibleName(
    /close refund detail panel/i,
  );
  await closeButton.click();
  await expect(
    page.getByRole("button", {
      name: /view details for refund rfnd_demo_1005/i,
    }),
  ).toBeFocused();
  await expect(
    page.getByRole("complementary", {
      name: /selected refund detail/i,
    }),
  ).toHaveCount(0);
  await expectRefundControlsLayoutStable(page, controlsBoxBeforeRowClick);

  await page.getByLabel(/sort refund table/i).selectOption("created-asc");
  await page.getByLabel(/risk filter/i).selectOption("urgent-high-risk");
  await page.getByRole("button", { name: /reset/i }).click();
  await expect(
    page.getByRole("complementary", {
      name: /selected refund detail/i,
    }),
  ).toHaveCount(0);

  const controlsBoxBeforeKeyboardOpen = await getRefundControlsBox(page);

  await page
    .getByRole("button", {
      name: /view details for refund rfnd_demo_1003/i,
    })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: /rfnd_demo_1003/i,
    }),
  ).toBeVisible();
  await expectRefundControlsLayoutStable(page, controlsBoxBeforeKeyboardOpen);

  await page
    .getByRole("button", {
      name: /view details for refund rfnd_demo_1001/i,
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: /rfnd_demo_1001/i,
    }),
  ).toBeVisible();
  await page.getByLabel(/sort refund table/i).selectOption("amount-desc");
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

  await page.setViewportSize({ width: 900, height: 900 });
  await expect(
    page.getByRole("heading", {
      name: /refund operations dashboard/i,
    }),
  ).toBeVisible();
  await expect(page.getByLabel(/search refunds/i)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /view details for refund rfnd_demo_1001/i,
    }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    )
    .toBe(true);
});
