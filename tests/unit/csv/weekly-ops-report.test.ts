import { describe, expect, it, vi } from "vitest";
import {
  buildWeeklyOpsReportCsv,
  escapeCsvField,
} from "@/lib/csv/weekly-ops-report";
import { weeklyOpsReportQuerySchema } from "@/server/services/weekly-ops-report-service";

vi.mock("@/server/repositories/reports", () => ({
  readWeeklyOpsReportRecords: vi.fn(),
}));

describe("weekly ops CSV escaping", () => {
  it("escapes commas, quotes, and newlines safely", () => {
    expect(escapeCsvField('A "quoted", multi\nline value')).toBe(
      '"A ""quoted"", multi\nline value"',
    );

    const csv = buildWeeklyOpsReportCsv([
      {
        amountCents: 1299,
        currency: "USD",
        customer: "Avery, Import",
        description: 'Needs "review"\nBefore shipping',
        occurredAt: "2026-06-15T00:00:00.000Z",
        orderNumber: "ORD-CSV-1",
        recordId: "record-1",
        section: "order",
        status: "PAID",
      },
    ]);

    expect(csv).toContain('"Avery, Import"');
    expect(csv).toContain('"Needs ""review""\nBefore shipping"');
  });
});

describe("weekly ops report query validation", () => {
  it("rejects impossible calendar dates instead of rolling them forward", () => {
    const result = weeklyOpsReportQuerySchema.safeParse({
      weekStart: "2026-02-31",
    });

    expect(result.success).toBe(false);
  });
});
