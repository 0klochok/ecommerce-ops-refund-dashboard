import { z } from "zod";
import { parseCsvRecords } from "@/lib/csv/orders-import";

export const requiredOrderImportColumns = [
  "orderNumber",
  "customerEmail",
  "customerName",
  "orderDate",
  "productType",
  "sku",
  "itemName",
  "quantity",
  "unitAmountCents",
  "fulfillmentStatus",
  "paymentStatus",
  "storeSource",
] as const;

const productTypeSchema = z.preprocess(
  normalizeEnumValue,
  z.enum(["PHYSICAL", "DIGITAL", "GIFT_CARD"]),
);

const fulfillmentStatusSchema = z.preprocess(
  normalizeEnumValue,
  z.enum([
    "NOT_REQUIRED",
    "UNFULFILLED",
    "PARTIALLY_FULFILLED",
    "FULFILLED",
    "DELAYED",
    "CANCELED",
  ]),
);

const paymentStatusSchema = z.preprocess(
  normalizeEnumValue,
  z.enum([
    "REQUIRES_PAYMENT",
    "PROCESSING",
    "SUCCEEDED",
    "FAILED",
    "CANCELED",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
    "DISPUTED",
  ]),
);

const storeSourceSchema = z.preprocess((value) => {
  const normalized = normalizeEnumValue(value);

  return normalized === "" ? "CSV_IMPORT" : normalized;
}, z.enum(["MOCK_STORE", "SHOPIFY", "WOOCOMMERCE", "STRIPE_ONLY", "CSV_IMPORT"]));

const positiveIntegerSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, "Must be a positive integer.")
  .transform(Number);

const nonNegativeIntegerSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Must be a non-negative integer.")
  .transform(Number);

const utcDateSchema = z
  .string()
  .trim()
  .refine((value) => parseUtcDate(value) !== null, {
    message: "Must be a valid UTC date in YYYY-MM-DD or ISO format.",
  })
  .transform((value) => parseUtcDate(value)?.toISOString() ?? value);

const rawOrderImportRowSchema = z.object({
  customerEmail: z.string().trim().email(),
  customerName: z.string().trim().min(2).max(120),
  fulfillmentStatus: fulfillmentStatusSchema,
  itemName: z.string().trim().min(1).max(160),
  orderDate: utcDateSchema,
  orderNumber: z.string().trim().min(1).max(80),
  paymentStatus: paymentStatusSchema,
  productType: productTypeSchema,
  quantity: positiveIntegerSchema,
  sku: z.string().trim().min(1).max(80),
  storeSource: storeSourceSchema,
  unitAmountCents: nonNegativeIntegerSchema,
});

export type ValidatedOrderImportRow = z.infer<typeof rawOrderImportRowSchema> & {
  rowNumber: number;
};

export type OrderImportValidationError = {
  field?: string;
  message: string;
  orderNumber?: string;
  rowNumber: number;
};

export type OrderImportValidationResult = {
  errors: OrderImportValidationError[];
  headers: string[];
  rowsProcessed: number;
  validRows: ValidatedOrderImportRow[];
};

export function validateOrderImportCsv(text: string): OrderImportValidationResult {
  const parseResult = parseCsvRecords(text);
  const firstRecord = parseResult.records[0];
  const errors: OrderImportValidationError[] = parseResult.errors.map((error) => ({
    message: error.message,
    rowNumber: error.rowNumber,
  }));

  if (!firstRecord) {
    return {
      errors: [
        ...errors,
        {
          message: "CSV file must include a header row.",
          rowNumber: 1,
        },
      ],
      headers: [],
      rowsProcessed: 0,
      validRows: [],
    };
  }

  const headers = firstRecord.values.map((value) => value.trim());
  const headerSet = new Set(headers);

  for (const column of requiredOrderImportColumns) {
    if (!headerSet.has(column)) {
      errors.push({
        field: column,
        message: `Missing required column: ${column}.`,
        rowNumber: firstRecord.recordNumber,
      });
    }
  }

  const dataRecords = parseResult.records
    .slice(1)
    .filter((record) => record.values.some((value) => value.trim().length > 0));

  if (errors.length > 0) {
    return {
      errors,
      headers,
      rowsProcessed: dataRecords.length,
      validRows: [],
    };
  }

  const validRows: ValidatedOrderImportRow[] = [];

  for (const record of dataRecords) {
    const rawRow = Object.fromEntries(
      headers.map((header, index) => [header, record.values[index] ?? ""]),
    );
    const parsedRow = rawOrderImportRowSchema.safeParse(rawRow);

    if (!parsedRow.success) {
      for (const issue of parsedRow.error.issues) {
        const field = issue.path[0]?.toString();

        errors.push({
          field,
          message: issue.message,
          orderNumber: rawRow.orderNumber?.trim(),
          rowNumber: record.recordNumber,
        });
      }

      continue;
    }

    validRows.push({
      ...parsedRow.data,
      rowNumber: record.recordNumber,
    });
  }

  return {
    errors,
    headers,
    rowsProcessed: dataRecords.length,
    validRows,
  };
}

function normalizeEnumValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function parseUtcDate(value: string) {
  const dateOnlyMatch = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(value);

  if (dateOnlyMatch) {
    const datePart = dateOnlyMatch[1];
    const dateOnly = new Date(`${datePart}T00:00:00.000Z`);

    if (
      Number.isNaN(dateOnly.getTime()) ||
      dateOnly.toISOString().slice(0, 10) !== datePart
    ) {
      return null;
    }

    const date =
      value.length === datePart.length
        ? dateOnly
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
