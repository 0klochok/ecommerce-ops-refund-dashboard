import { describe, expect, it } from "vitest";
import {
  calculateRefundMetrics,
  type RefundOperation,
} from "@/lib/mock-data/refunds";

const makeRefund = (
  overrides: Partial<RefundOperation> = {},
): RefundOperation => ({
  amountCents: 1000,
  channel: "Online store",
  createdAt: "2026-06-18",
  currency: "USD",
  customerLabel: "Demo customer",
  id: "rfnd_test_1000",
  orderId: "ORD-TEST",
  priority: "standard",
  reason: "Synthetic test refund",
  riskSummary: "No risk",
  slaLabel: "2 days left",
  status: "pending_review",
  ...overrides,
});

describe("calculateRefundMetrics", () => {
  it("summarizes refund totals, open work, and urgent risk", () => {
    const metrics = calculateRefundMetrics([
      makeRefund({
        amountCents: 1000,
        id: "rfnd_test_1001",
        priority: "urgent",
        status: "pending_review",
      }),
      makeRefund({
        amountCents: 2500,
        id: "rfnd_test_1002",
        priority: "watch",
        status: "resolved",
      }),
      makeRefund({
        amountCents: 1500,
        id: "rfnd_test_1003",
        priority: "high",
        status: "processing",
      }),
    ]);

    expect(metrics).toEqual({
      averageRefundAmountCents: 1667,
      openRefunds: 2,
      totalRefundAmountCents: 5000,
      totalRefunds: 3,
      urgentRefunds: 2,
    });
  });

  it("returns zeroed metrics for an empty refund list", () => {
    expect(calculateRefundMetrics([])).toEqual({
      averageRefundAmountCents: 0,
      openRefunds: 0,
      totalRefundAmountCents: 0,
      totalRefunds: 0,
      urgentRefunds: 0,
    });
  });
});
