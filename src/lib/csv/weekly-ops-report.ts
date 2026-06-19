export type WeeklyOpsCsvRow = {
  amountCents: number | "";
  currency: string;
  customer: string;
  description: string;
  occurredAt: string;
  orderNumber: string;
  recordId: string;
  section: "alert" | "dispute" | "fulfillment_delay" | "order" | "refund";
  status: string;
};

export const weeklyOpsReportHeaders = [
  "section",
  "recordId",
  "orderNumber",
  "customer",
  "status",
  "amountCents",
  "currency",
  "occurredAt",
  "description",
] as const;

export function escapeCsvField(value: Date | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = value instanceof Date ? value.toISOString() : String(value);
  const requiresEscaping = /[",\r\n]/.test(text);

  if (!requiresEscaping) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function buildCsv(
  headers: readonly string[],
  rows: readonly Record<string, Date | number | string | null | undefined>[],
) {
  return [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvField(row[header])).join(","),
    ),
  ].join("\r\n");
}

export function buildWeeklyOpsReportCsv(rows: readonly WeeklyOpsCsvRow[]) {
  return buildCsv(weeklyOpsReportHeaders, rows);
}

