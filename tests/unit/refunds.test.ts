import { describe, expect, it } from "vitest";
import {
  calculateRefundMetrics,
  defaultRefundTableQuery,
  getRefundTableRows,
  isUrgentOrHighRiskRefund,
  type RefundOperation,
  type RefundTableQuery,
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

const makeQuery = (
  overrides: Partial<RefundTableQuery> = {},
): RefundTableQuery => ({
  ...defaultRefundTableQuery,
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

  it("uses the shared urgent/high-risk predicate for the KPI count", () => {
    const refunds = [
      makeRefund({
        id: "rfnd_priority_urgent",
        priority: "urgent",
      }),
      makeRefund({
        id: "rfnd_priority_high",
        priority: "high",
      }),
      makeRefund({
        id: "rfnd_priority_standard",
        priority: "standard",
      }),
      makeRefund({
        id: "rfnd_priority_watch",
        priority: "watch",
      }),
    ];

    expect(refunds.filter(isUrgentOrHighRiskRefund).map((refund) => refund.id))
      .toEqual(["rfnd_priority_urgent", "rfnd_priority_high"]);
    expect(calculateRefundMetrics(refunds).urgentRefunds).toBe(
      refunds.filter(isUrgentOrHighRiskRefund).length,
    );
  });
});

describe("getRefundTableRows", () => {
  it("searches refund id, order id, and customer label case-insensitively", () => {
    const refunds = [
      makeRefund({
        customerLabel: "Returning Customer A",
        id: "rfnd_search_1001",
        orderId: "ORD-ALPHA",
      }),
      makeRefund({
        customerLabel: "Guest Checkout B",
        id: "rfnd_search_1002",
        orderId: "ORD-BETA",
      }),
      makeRefund({
        customerLabel: "Wholesale Buyer C",
        id: "rfnd_search_1003",
        orderId: "ORD-GAMMA",
      }),
    ];

    expect(
      getRefundTableRows(refunds, makeQuery({ searchText: "SEARCH_1002" })),
    ).toHaveLength(1);
    expect(getRefundTableRows(refunds, makeQuery({ searchText: "beta" }))[0])
      .toMatchObject({ id: "rfnd_search_1002" });
    expect(
      getRefundTableRows(refunds, makeQuery({ searchText: "wholesale" }))[0],
    ).toMatchObject({ id: "rfnd_search_1003" });
  });

  it("combines status and channel filters", () => {
    const refunds = [
      makeRefund({
        channel: "Stripe test",
        id: "rfnd_filter_1001",
        status: "pending_review",
      }),
      makeRefund({
        channel: "Online store",
        id: "rfnd_filter_1002",
        status: "pending_review",
      }),
      makeRefund({
        channel: "Stripe test",
        id: "rfnd_filter_1003",
        status: "resolved",
      }),
    ];

    expect(
      getRefundTableRows(
        refunds,
        makeQuery({ channel: "Stripe test", status: "pending_review" }),
      ).map((refund) => refund.id),
      ).toEqual(["rfnd_filter_1001"]);
  });

  it("filters urgent/high-risk rows with the same predicate used by the KPI", () => {
    const refunds = [
      makeRefund({
        id: "rfnd_risk_urgent",
        priority: "urgent",
      }),
      makeRefund({
        id: "rfnd_risk_high",
        priority: "high",
      }),
      makeRefund({
        id: "rfnd_risk_standard",
        priority: "standard",
      }),
      makeRefund({
        id: "rfnd_risk_watch",
        priority: "watch",
      }),
    ];

    const expectedRefundIds = refunds
      .filter(isUrgentOrHighRiskRefund)
      .map((refund) => refund.id);

    expect(
      getRefundTableRows(
        refunds,
        makeQuery({ risk: "urgent-high-risk" }),
      ).map((refund) => refund.id),
    ).toEqual(expectedRefundIds);
  });

  it("sorts by amount and created date in both directions", () => {
    const refunds = [
      makeRefund({
        amountCents: 2000,
        createdAt: "2026-06-16",
        id: "rfnd_sort_middle",
      }),
      makeRefund({
        amountCents: 500,
        createdAt: "2026-06-10",
        id: "rfnd_sort_low_old",
      }),
      makeRefund({
        amountCents: 3500,
        createdAt: "2026-06-18",
        id: "rfnd_sort_high_new",
      }),
    ];

    expect(
      getRefundTableRows(refunds, makeQuery({ sort: "amount-desc" })).map(
        (refund) => refund.id,
      ),
    ).toEqual(["rfnd_sort_high_new", "rfnd_sort_middle", "rfnd_sort_low_old"]);
    expect(
      getRefundTableRows(refunds, makeQuery({ sort: "amount-asc" })).map(
        (refund) => refund.id,
      ),
    ).toEqual(["rfnd_sort_low_old", "rfnd_sort_middle", "rfnd_sort_high_new"]);
    expect(
      getRefundTableRows(refunds, makeQuery({ sort: "created-desc" })).map(
        (refund) => refund.id,
      ),
    ).toEqual(["rfnd_sort_high_new", "rfnd_sort_middle", "rfnd_sort_low_old"]);
    expect(
      getRefundTableRows(refunds, makeQuery({ sort: "created-asc" })).map(
        (refund) => refund.id,
      ),
    ).toEqual(["rfnd_sort_low_old", "rfnd_sort_middle", "rfnd_sort_high_new"]);
  });

  it("returns an empty list when no rows match", () => {
    expect(
      getRefundTableRows(
        [makeRefund({ id: "rfnd_empty_1001", orderId: "ORD-EMPTY" })],
        makeQuery({ searchText: "not-a-demo-refund" }),
      ),
    ).toEqual([]);
  });
});
