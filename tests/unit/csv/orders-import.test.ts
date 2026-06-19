import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateOrderImportCsv } from "@/lib/validation/order-import";

const fixturesDir = join(process.cwd(), "tests", "fixtures");

describe("validateOrderImportCsv", () => {
  it("accepts the valid sample fixture rows", () => {
    const csv = readFileSync(
      join(fixturesDir, "orders-import-sample.csv"),
      "utf8",
    );
    const result = validateOrderImportCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.rowsProcessed).toBe(3);
    expect(result.validRows).toHaveLength(3);
    expect(result.validRows[0]).toMatchObject({
      customerEmail: "demo.import.001@example.test",
      itemName: "Demo Mug, 16oz",
      orderNumber: "ORD-IMPORT-1001",
      quantity: 2,
      unitAmountCents: 2599,
    });
  });

  it("rejects invalid sample fixture rows with row-level errors", () => {
    const csv = readFileSync(
      join(fixturesDir, "orders-import-invalid.csv"),
      "utf8",
    );
    const result = validateOrderImportCsv(csv);

    expect(result.rowsProcessed).toBe(3);
    expect(result.validRows).toEqual([]);
    expect(result.errors.length).toBeGreaterThanOrEqual(6);
    expect(result.errors.map((error) => error.rowNumber)).toEqual(
      expect.arrayContaining([2, 3, 4]),
    );
    expect(result.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining([
        "customerEmail",
        "customerName",
        "orderDate",
        "paymentStatus",
        "productType",
        "quantity",
        "unitAmountCents",
      ]),
    );
  });

  it("rejects impossible calendar dates instead of rolling them forward", () => {
    const result = validateOrderImportCsv(`orderNumber,customerEmail,customerName,orderDate,productType,sku,itemName,quantity,unitAmountCents,fulfillmentStatus,paymentStatus,storeSource
ORD-BAD-DATE,demo.bad.date@example.test,Bad Date,2026-02-31,PHYSICAL,PHY-BAD-DATE,Bad date,1,2599,UNFULFILLED,SUCCEEDED,CSV_IMPORT
`);

    expect(result.validRows).toEqual([]);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "orderDate",
          rowNumber: 2,
        }),
      ]),
    );
  });
});
