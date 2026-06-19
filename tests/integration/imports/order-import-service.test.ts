import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  importOrdersFromCsv,
  type ImportedOrderInput,
  type OrderImportRepository,
} from "@/server/services/order-import-service";

function createFakeRepository(): OrderImportRepository & {
  createdOrders: ImportedOrderInput[];
} {
  const customers = new Map<string, string>();
  const createdOrders: ImportedOrderInput[] = [];

  return {
    async completeBatch() {},
    async createBatch() {
      return {
        id: "batch-test-1",
      };
    },
    async createImportedOrder(input) {
      createdOrders.push(input);
    },
    async failBatch() {},
    async findExistingOrderNumbers() {
      return new Set();
    },
    async findOrCreateCustomer(input) {
      const existingCustomerId = customers.get(input.email);

      if (existingCustomerId) {
        return {
          created: false,
          id: existingCustomerId,
        };
      }

      const id = `customer-${customers.size + 1}`;
      customers.set(input.email, id);

      return {
        created: true,
        id,
      };
    },
    createdOrders,
  };
}

describe("importOrdersFromCsv", () => {
  it("validates a CSV fixture and returns a useful summary", async () => {
    const repository = createFakeRepository();
    const csv = readFileSync(
      join(process.cwd(), "tests", "fixtures", "orders-import-sample.csv"),
      "utf8",
    );
    const summary = await importOrdersFromCsv({
      fileName: "orders-import-sample.csv",
      now: new Date("2026-06-19T00:00:00.000Z"),
      repository,
      text: csv,
    });

    expect(summary).toMatchObject({
      batchId: "batch-test-1",
      customersCreated: 2,
      customersMatched: 0,
      ordersCreated: 2,
      rowsProcessed: 3,
      rowsRejected: 0,
      status: "COMPLETED",
    });
    expect(repository.createdOrders).toHaveLength(2);
    expect(repository.createdOrders[0]?.items).toHaveLength(2);
  });
});

