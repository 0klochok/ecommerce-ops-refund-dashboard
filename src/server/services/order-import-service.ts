import type { ImportBatchStatus } from "@/generated/prisma/client";
import {
  validateOrderImportCsv,
  type OrderImportValidationError,
  type ValidatedOrderImportRow,
} from "@/lib/validation/order-import";

export type OrderImportSummary = {
  batchId: string;
  customersCreated: number;
  customersMatched: number;
  errors: OrderImportValidationError[];
  ordersCreated: number;
  rowsProcessed: number;
  rowsRejected: number;
  status: ImportBatchStatus;
};

export type ImportedOrderItemInput = {
  name: string;
  productType: ValidatedOrderImportRow["productType"];
  quantity: number;
  sku: string;
  unitAmountCents: number;
};

export type ImportedOrderInput = {
  customerId: string;
  fulfillmentStatus: ValidatedOrderImportRow["fulfillmentStatus"];
  importBatchId: string;
  items: ImportedOrderItemInput[];
  orderDate: Date;
  orderNumber: string;
  paymentStatus: ValidatedOrderImportRow["paymentStatus"];
  source: ValidatedOrderImportRow["storeSource"];
};

export type OrderImportRepository = {
  completeBatch: (
    batchId: string,
    input: {
      completedAt: Date;
      failureCount: number;
      notes: string;
      successCount: number;
    },
  ) => Promise<void>;
  createBatch: (input: {
    fileName: string;
    importedAt: Date;
    rowCount: number;
  }) => Promise<{ id: string }>;
  createImportedOrder: (input: ImportedOrderInput) => Promise<void>;
  failBatch: (
    batchId: string,
    input: {
      completedAt: Date;
      failureCount: number;
      notes: string;
    },
  ) => Promise<void>;
  findExistingOrderNumbers: (
    orderNumbers: readonly string[],
  ) => Promise<Set<string>>;
  findOrCreateCustomer: (input: {
    email: string;
    name: string;
  }) => Promise<{ created: boolean; id: string }>;
};

type OrderImportGroup = {
  key: string;
  rows: ValidatedOrderImportRow[];
};

export async function importOrdersFromCsv({
  fileName,
  now = new Date(),
  repository,
  text,
}: {
  fileName: string;
  now?: Date;
  repository?: OrderImportRepository;
  text: string;
}): Promise<OrderImportSummary> {
  const activeRepository = repository ?? (await getDefaultOrderImportRepository());
  const validation = validateOrderImportCsv(text);
  const batch = await activeRepository.createBatch({
    fileName,
    importedAt: now,
    rowCount: validation.rowsProcessed,
  });
  const errors = [...validation.errors];

  if (validation.headers.length === 0 || hasHeaderError(errors)) {
    await activeRepository.failBatch(batch.id, {
      completedAt: now,
      failureCount: validation.rowsProcessed,
      notes: "CSV import failed before row processing because the file header was invalid.",
    });

    return {
      batchId: batch.id,
      customersCreated: 0,
      customersMatched: 0,
      errors,
      ordersCreated: 0,
      rowsProcessed: validation.rowsProcessed,
      rowsRejected: validation.rowsProcessed,
      status: "FAILED",
    };
  }

  try {
    const groupedRows = groupValidRows(validation.validRows);
    const rejectedRowNumbers = new Set(errors.map((error) => error.rowNumber));

    rejectConflictingGroups(groupedRows, errors, rejectedRowNumbers);

    const existingOrderNumbers = await activeRepository.findExistingOrderNumbers(
      groupedRows.map((group) => group.key),
    );

    for (const group of groupedRows) {
      if (!existingOrderNumbers.has(group.key)) {
        continue;
      }

      for (const row of group.rows) {
        rejectedRowNumbers.add(row.rowNumber);
        errors.push({
          field: "orderNumber",
          message: `Order number ${group.key} already exists and was not overwritten.`,
          orderNumber: group.key,
          rowNumber: row.rowNumber,
        });
      }
    }

    let customersCreated = 0;
    let customersMatched = 0;
    let ordersCreated = 0;

    for (const group of groupedRows) {
      if (group.rows.some((row) => rejectedRowNumbers.has(row.rowNumber))) {
        continue;
      }

      const firstRow = group.rows[0];

      if (!firstRow) {
        continue;
      }

      const customer = await activeRepository.findOrCreateCustomer({
        email: firstRow.customerEmail,
        name: firstRow.customerName,
      });

      if (customer.created) {
        customersCreated += 1;
      } else {
        customersMatched += 1;
      }

      await activeRepository.createImportedOrder({
        customerId: customer.id,
        fulfillmentStatus: firstRow.fulfillmentStatus,
        importBatchId: batch.id,
        items: group.rows.map((row) => ({
          name: row.itemName,
          productType: row.productType,
          quantity: row.quantity,
          sku: row.sku,
          unitAmountCents: row.unitAmountCents,
        })),
        orderDate: new Date(firstRow.orderDate),
        orderNumber: firstRow.orderNumber,
        paymentStatus: firstRow.paymentStatus,
        source: firstRow.storeSource,
      });
      ordersCreated += 1;
    }

    const rowsRejected = rejectedRowNumbers.size;

    await activeRepository.completeBatch(batch.id, {
      completedAt: now,
      failureCount: rowsRejected,
      notes:
        rowsRejected > 0
          ? "CSV import completed with rejected demo rows."
          : "CSV import completed successfully with demo rows.",
      successCount: validation.rowsProcessed - rowsRejected,
    });

    return {
      batchId: batch.id,
      customersCreated,
      customersMatched,
      errors,
      ordersCreated,
      rowsProcessed: validation.rowsProcessed,
      rowsRejected,
      status: "COMPLETED",
    };
  } catch (error) {
    await activeRepository.failBatch(batch.id, {
      completedAt: now,
      failureCount: validation.rowsProcessed,
      notes:
        error instanceof Error
          ? `CSV import failed: ${error.message}`
          : "CSV import failed with an unknown error.",
    });

    throw error;
  }
}

async function getDefaultOrderImportRepository() {
  const { orderImportRepository } = await import(
    "@/server/repositories/imports-repository"
  );

  return orderImportRepository;
}

function groupValidRows(rows: readonly ValidatedOrderImportRow[]) {
  const groups = new Map<string, OrderImportGroup>();

  for (const row of rows) {
    const existingGroup = groups.get(row.orderNumber);

    if (existingGroup) {
      existingGroup.rows.push(row);
      continue;
    }

    groups.set(row.orderNumber, {
      key: row.orderNumber,
      rows: [row],
    });
  }

  return Array.from(groups.values());
}

function rejectConflictingGroups(
  groups: readonly OrderImportGroup[],
  errors: OrderImportValidationError[],
  rejectedRowNumbers: Set<number>,
) {
  for (const group of groups) {
    const firstRow = group.rows[0];

    if (!firstRow) {
      continue;
    }

    const hasConflict = group.rows.some(
      (row) =>
        row.customerEmail !== firstRow.customerEmail ||
        row.customerName !== firstRow.customerName ||
        row.orderDate !== firstRow.orderDate ||
        row.fulfillmentStatus !== firstRow.fulfillmentStatus ||
        row.paymentStatus !== firstRow.paymentStatus ||
        row.storeSource !== firstRow.storeSource,
    );

    if (!hasConflict) {
      continue;
    }

    for (const row of group.rows) {
      rejectedRowNumbers.add(row.rowNumber);
      errors.push({
        field: "orderNumber",
        message:
          "Rows sharing an order number must use matching customer, date, source, payment, and fulfillment fields.",
        orderNumber: group.key,
        rowNumber: row.rowNumber,
      });
    }
  }
}

function hasHeaderError(errors: readonly OrderImportValidationError[]) {
  return errors.some((error) => error.rowNumber === 1 && error.field);
}
