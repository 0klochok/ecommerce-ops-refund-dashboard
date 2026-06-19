import { describe, expect, it } from "vitest";
import { getWeeklyRevenueRefundChartData } from "@/lib/domain/dashboard";

describe("getWeeklyRevenueRefundChartData", () => {
  it("groups counted revenue and completed refunds by UTC week", () => {
    const chartData = getWeeklyRevenueRefundChartData({
      orders: [
        {
          fulfillmentStatus: "FULFILLED",
          hasPhysicalItems: true,
          paymentStatus: "SUCCEEDED",
          placedAt: "2026-06-10T10:00:00.000Z",
          status: "PAID",
          totalCents: 10_000,
        },
        {
          fulfillmentStatus: "FULFILLED",
          hasPhysicalItems: true,
          paymentStatus: "SUCCEEDED",
          placedAt: "2026-06-11T10:00:00.000Z",
          status: "CANCELED",
          totalCents: 99_999,
        },
        {
          fulfillmentStatus: "FULFILLED",
          hasPhysicalItems: true,
          paymentStatus: "FAILED",
          placedAt: "2026-06-16T10:00:00.000Z",
          status: "PAYMENT_FAILED",
          totalCents: 50_000,
        },
      ],
      refunds: [
        {
          amountCents: 1_500,
          processedAt: "2026-06-12T10:00:00.000Z",
          requestedAt: "2026-06-11T10:00:00.000Z",
          status: "SUCCEEDED",
        },
        {
          amountCents: 2_500,
          processedAt: null,
          requestedAt: "2026-06-17T10:00:00.000Z",
          status: "PROCESSING",
        },
      ],
    });

    expect(chartData).toEqual([
      {
        refundCents: 1_500,
        revenueCents: 10_000,
        weekLabel: "Jun 8",
        weekStart: "2026-06-08",
      },
    ]);
  });

  it("returns an empty series when there is no counted activity", () => {
    expect(
      getWeeklyRevenueRefundChartData({
        orders: [],
        refunds: [],
      }),
    ).toEqual([]);
  });
});
