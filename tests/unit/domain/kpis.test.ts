import { describe, expect, it } from "vitest";
import {
  calculateDashboardKpis,
  type KpiDispute,
  type KpiOrder,
  type KpiPayment,
  type KpiRefund,
} from "@/lib/domain/kpis";

const referenceDate = new Date("2026-06-15T12:00:00.000Z");

const makeOrder = (overrides: Partial<KpiOrder> = {}): KpiOrder => ({
  fulfillmentStatus: "FULFILLED",
  hasPhysicalItems: true,
  paymentStatus: "SUCCEEDED",
  placedAt: "2026-06-13T12:00:00.000Z",
  status: "PAID",
  totalCents: 10_000,
  ...overrides,
});

const makeRefund = (overrides: Partial<KpiRefund> = {}): KpiRefund => ({
  amountCents: 1_000,
  status: "SUCCEEDED",
  ...overrides,
});

const makePayment = (overrides: Partial<KpiPayment> = {}): KpiPayment => ({
  status: "SUCCEEDED",
  ...overrides,
});

const makeDispute = (overrides: Partial<KpiDispute> = {}): KpiDispute => ({
  amountCents: 2_000,
  status: "NEEDS_RESPONSE",
  ...overrides,
});

describe("calculateDashboardKpis", () => {
  it("calculates a normal mixed operations dataset", () => {
    const metrics = calculateDashboardKpis({
      disputes: [
        makeDispute({ amountCents: 3_000, status: "NEEDS_RESPONSE" }),
        makeDispute({ amountCents: 2_000, status: "UNDER_REVIEW" }),
      ],
      orders: [
        makeOrder({ totalCents: 10_000 }),
        makeOrder({
          fulfillmentStatus: "UNFULFILLED",
          placedAt: "2026-06-10T12:00:00.000Z",
          totalCents: 5_000,
        }),
        makeOrder({
          hasPhysicalItems: false,
          fulfillmentStatus: "NOT_REQUIRED",
          totalCents: 2_000,
        }),
      ],
      payments: [
        makePayment({ status: "SUCCEEDED" }),
        makePayment({ status: "FAILED" }),
      ],
      referenceDate,
      refunds: [makeRefund({ amountCents: 1_500 })],
    });

    expect(metrics).toEqual({
      averageOrderValueCents: 5_667,
      delayedFulfillmentCount: 1,
      disputedAmountCents: 5_000,
      failedPaymentCount: 1,
      grossRevenueCents: 17_000,
      orderCount: 3,
      refundAmountCents: 1_500,
      refundRate: 1_500 / 17_000,
      unfulfilledOrderCount: 1,
    });
  });

  it("returns zero rate and average order value when revenue is zero", () => {
    const metrics = calculateDashboardKpis({
      disputes: [],
      orders: [],
      payments: [],
      referenceDate,
      refunds: [makeRefund({ amountCents: 2_000 })],
    });

    expect(metrics.grossRevenueCents).toBe(0);
    expect(metrics.refundRate).toBe(0);
    expect(metrics.averageOrderValueCents).toBe(0);
  });

  it("excludes canceled orders from revenue and order count", () => {
    const metrics = calculateDashboardKpis({
      disputes: [],
      orders: [
        makeOrder({ status: "CANCELED", totalCents: 99_999 }),
        makeOrder({ totalCents: 7_500 }),
      ],
      payments: [],
      referenceDate,
      refunds: [],
    });

    expect(metrics.orderCount).toBe(1);
    expect(metrics.grossRevenueCents).toBe(7_500);
  });

  it("includes completed refunds and excludes failed or pending refunds", () => {
    const metrics = calculateDashboardKpis({
      disputes: [],
      orders: [makeOrder({ totalCents: 20_000 })],
      payments: [],
      referenceDate,
      refunds: [
        makeRefund({ amountCents: 1_000, status: "SUCCEEDED" }),
        makeRefund({ amountCents: 2_000, status: "COMPLETED" }),
        makeRefund({ amountCents: 3_000, status: "FAILED" }),
        makeRefund({ amountCents: 4_000, status: "PENDING" }),
      ],
    });

    expect(metrics.refundAmountCents).toBe(3_000);
    expect(metrics.refundRate).toBe(3_000 / 20_000);
  });

  it("counts only physical orders that are not fulfilled or canceled as unfulfilled", () => {
    const metrics = calculateDashboardKpis({
      disputes: [],
      orders: [
        makeOrder({ fulfillmentStatus: "UNFULFILLED", hasPhysicalItems: true }),
        makeOrder({
          fulfillmentStatus: "PARTIALLY_FULFILLED",
          hasPhysicalItems: true,
        }),
        makeOrder({ fulfillmentStatus: "FULFILLED", hasPhysicalItems: true }),
        makeOrder({
          fulfillmentStatus: "NOT_REQUIRED",
          hasPhysicalItems: false,
        }),
        makeOrder({
          fulfillmentStatus: "CANCELED",
          hasPhysicalItems: true,
          status: "CANCELED",
        }),
      ],
      payments: [],
      referenceDate,
      refunds: [],
    });

    expect(metrics.unfulfilledOrderCount).toBe(2);
  });

  it("counts delayed fulfillment by threshold and reference date", () => {
    const metrics = calculateDashboardKpis({
      delayedFulfillmentThresholdHours: 72,
      disputes: [],
      orders: [
        makeOrder({
          fulfillmentStatus: "UNFULFILLED",
          placedAt: "2026-06-11T11:59:59.000Z",
        }),
        makeOrder({
          fulfillmentStatus: "UNFULFILLED",
          placedAt: "2026-06-13T12:00:00.000Z",
        }),
      ],
      payments: [],
      referenceDate,
      refunds: [],
    });

    expect(metrics.delayedFulfillmentCount).toBe(1);
  });

  it("calculates active disputed amount and excludes closed outcomes", () => {
    const metrics = calculateDashboardKpis({
      disputes: [
        makeDispute({ amountCents: 4_000, status: "NEEDS_RESPONSE" }),
        makeDispute({ amountCents: 5_000, status: "UNDER_REVIEW" }),
        makeDispute({ amountCents: 6_000, status: "WON" }),
        makeDispute({ amountCents: 7_000, status: "LOST" }),
        makeDispute({ amountCents: 8_000, status: "CLOSED" }),
      ],
      orders: [],
      payments: [],
      referenceDate,
      refunds: [],
    });

    expect(metrics.disputedAmountCents).toBe(9_000);
  });
});
