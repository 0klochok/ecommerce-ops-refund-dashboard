import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const outputVideoPath = resolve(
  "docs",
  "demo",
  "ecommerce-ops-refund-dashboard-demo.webm",
);

test("records the client-facing operations demo video", async ({
  page,
}, testInfo) => {
  const video = page.video();

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /business-value operations overview/i,
    }),
  ).toBeVisible();
  await pause(page);

  await page.getByRole("link", { name: /^orders$/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /orders queue/i,
    }),
  ).toBeVisible();
  await page
    .getByLabel(/search orders by order number, customer, or email/i)
    .fill("ORD-DEMO-00017");
  await page.getByLabel(/payment filter/i).click();
  await page.getByRole("option", { name: /^failed$/i }).click();
  await expect(page.getByRole("cell", { name: /ord-demo-00017/i })).toBeVisible();
  await pause(page);

  await page.getByRole("link", { name: /^view$/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /ord-demo-00017/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /payment, refund, and dispute records/i,
    }),
  ).toBeVisible();
  await pause(page);

  await page.getByRole("link", { name: /^refunds$/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /refund operations/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/No Stripe calls are made/i)).toBeVisible();
  await pause(page);

  await page.getByRole("link", { name: /imports/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /import demo orders/i,
    }),
  ).toBeVisible();
  await page
    .getByLabel(/orders csv file/i)
    .setInputFiles(await createUniqueImportFixture(testInfo));
  await page.getByRole("button", { name: /import orders csv/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /import completed/i,
    }),
  ).toBeVisible({ timeout: 30_000 });
  await pause(page);

  await page.getByRole("link", { name: /alerts/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /operational alerts/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /recalculate alerts/i }).click();
  await expect(page.getByText(/recalculated alerts:/i)).toBeVisible({
    timeout: 30_000,
  });
  await pause(page);

  await page.getByRole("link", { exact: true, name: "Dashboard" }).click();
  await expect(
    page.getByRole("heading", {
      name: /business-value operations overview/i,
    }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /download weekly ops csv/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /^weekly-ops-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  await pause(page, 1_000);

  await page.getByRole("link", { name: /^refunds$/i }).click();
  await expect(page.getByText(/No Stripe calls are made/i)).toBeVisible();
  await pause(page, 1_000);

  await page.close();

  if (!video) {
    throw new Error("Playwright video capture was not enabled.");
  }

  await mkdir(resolve("docs", "demo"), { recursive: true });
  await video.saveAs(outputVideoPath);
  console.log(`Demo video saved to ${outputVideoPath}`);
});

async function createUniqueImportFixture(testInfo: TestInfo) {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  const fixture = await readFile(
    resolve("tests", "fixtures", "orders-import-sample.csv"),
    "utf8",
  );
  const csv = fixture
    .replaceAll("ORD-IMPORT-1001", `ORD-MEDIA-${runId}-1`)
    .replaceAll("ORD-IMPORT-1002", `ORD-MEDIA-${runId}-2`)
    .replaceAll("demo.import.001@example.test", `media-${runId}-1@example.test`)
    .replaceAll("demo.import.002@example.test", `media-${runId}-2@example.test`)
    .replaceAll("Avery Import", `Avery Media ${runId}`)
    .replaceAll("Blake Import", `Blake Media ${runId}`);
  const csvPath = testInfo.outputPath(`orders-media-${runId}.csv`);

  await writeFile(csvPath, csv);

  return csvPath;
}

async function pause(page: Page, durationMs = 700) {
  await page.waitForTimeout(durationMs);
}
