import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("supports the operational import, alert, and weekly export workflow", async ({
  page,
}, testInfo) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  const firstOrderNumber = `ORD-E2E-${runId}-1`;
  const secondOrderNumber = `ORD-E2E-${runId}-2`;
  const fixture = await readFile(
    join(process.cwd(), "tests", "fixtures", "orders-import-sample.csv"),
    "utf8",
  );
  const csv = fixture
    .replaceAll("ORD-IMPORT-1001", firstOrderNumber)
    .replaceAll("ORD-IMPORT-1002", secondOrderNumber)
    .replaceAll("demo.import.001@example.test", `e2e-${runId}-1@example.test`)
    .replaceAll("demo.import.002@example.test", `e2e-${runId}-2@example.test`)
    .replaceAll("Avery Import", `Avery E2E ${runId}`)
    .replaceAll("Blake Import", `Blake E2E ${runId}`);
  const tempCsvPath = testInfo.outputPath(`orders-${runId}.csv`);

  await writeFile(tempCsvPath, csv);

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /business-value operations overview/i,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /imports/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /import demo orders/i,
    }),
  ).toBeVisible();

  await page.getByLabel(/orders csv file/i).setInputFiles(tempCsvPath);
  await page.getByRole("button", { name: /import orders csv/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /import completed/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/orders created/i)).toBeVisible();

  await page.getByRole("link", { name: /^orders$/i }).click();
  await page
    .getByLabel(/search orders by order number, customer, or email/i)
    .fill(firstOrderNumber);
  await expect(
    page.getByRole("cell", {
      name: new RegExp(firstOrderNumber, "i"),
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /alerts/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /operational alerts/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /recalculate alerts/i }).click();
  await expect(page.getByText(/recalculated alerts:/i)).toBeVisible();

  await page.getByRole("link", { exact: true, name: "Dashboard" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /download weekly ops csv/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^weekly-ops-\d{4}-\d{2}-\d{2}\.csv$/);
});
