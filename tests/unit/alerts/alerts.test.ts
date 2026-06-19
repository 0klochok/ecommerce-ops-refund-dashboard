import { describe, expect, it } from "vitest";
import {
  buildAlertCandidates,
  dedupeAlertCandidates,
  filterNewAlertCandidates,
  getAlertDedupeKey,
  type AlertCandidate,
  type AlertRuleConfig,
} from "@/lib/domain/alerts";

const rules: AlertRuleConfig[] = [
  {
    enabled: true,
    failureCountThreshold: null,
    id: "rule-delay",
    name: "Delayed fulfillment",
    severity: "HIGH",
    thresholdCents: null,
    thresholdHours: 72,
    type: "DELAYED_FULFILLMENT",
  },
  {
    enabled: true,
    failureCountThreshold: null,
    id: "rule-refund",
    name: "High refund",
    severity: "MEDIUM",
    thresholdCents: 10_000,
    thresholdHours: null,
    type: "HIGH_REFUND_AMOUNT",
  },
  {
    enabled: true,
    failureCountThreshold: 2,
    id: "rule-payment",
    name: "Repeated failed payments",
    severity: "CRITICAL",
    thresholdCents: null,
    thresholdHours: null,
    type: "REPEATED_FAILED_PAYMENT",
  },
];

describe("alert candidate evaluation", () => {
  it("detects delayed fulfillment", () => {
    const candidates = buildAlertCandidates({
      orders: [
        {
          customerId: "customer-1",
          fulfillmentStatus: "UNFULFILLED",
          hasPhysicalItems: true,
          id: "order-1",
          orderNumber: "ORD-1",
          placedAt: "2026-06-10T00:00:00.000Z",
          status: "PAID",
        },
      ],
      payments: [],
      referenceDate: "2026-06-15T00:00:00.000Z",
      refunds: [],
      rules,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      orderId: "order-1",
      type: "DELAYED_FULFILLMENT",
    });
  });

  it("detects high refund amount", () => {
    const candidates = buildAlertCandidates({
      orders: [],
      payments: [],
      referenceDate: "2026-06-15T00:00:00.000Z",
      refunds: [
        {
          amountCents: 12_000,
          currency: "USD",
          customerId: "customer-1",
          id: "refund-1",
          orderId: "order-1",
          providerRefundId: "re_mock_1",
          requestedAt: "2026-06-14T00:00:00.000Z",
          status: "SUCCEEDED",
        },
      ],
      rules,
    });

    expect(candidates[0]).toMatchObject({
      refundId: "refund-1",
      type: "HIGH_REFUND_AMOUNT",
    });
  });

  it("detects repeated failed payments", () => {
    const candidates = buildAlertCandidates({
      orders: [],
      payments: [
        {
          createdAt: "2026-06-14T00:00:00.000Z",
          customerId: "customer-1",
          failedAt: "2026-06-14T00:00:00.000Z",
          id: "payment-1",
          providerPaymentId: "pi_1",
          status: "FAILED",
        },
        {
          createdAt: "2026-06-15T00:00:00.000Z",
          customerId: "customer-1",
          failedAt: "2026-06-15T00:00:00.000Z",
          id: "payment-2",
          providerPaymentId: "pi_2",
          status: "FAILED",
        },
      ],
      referenceDate: "2026-06-15T00:00:00.000Z",
      refunds: [],
      rules,
    });

    expect(candidates[0]).toMatchObject({
      customerId: "customer-1",
      paymentId: "payment-2",
      type: "REPEATED_FAILED_PAYMENT",
    });
  });

  it("dedupes and filters existing candidates by pure dedupe key", () => {
    const candidate: AlertCandidate = {
      customerId: "customer-1",
      description: "Repeated failures",
      paymentId: "payment-1",
      ruleId: "rule-payment",
      severity: "CRITICAL",
      title: "Repeated failed payments",
      triggeredAt: "2026-06-15T00:00:00.000Z",
      type: "REPEATED_FAILED_PAYMENT",
    };
    const candidates = dedupeAlertCandidates([
      candidate,
      {
        ...candidate,
        paymentId: "payment-2",
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(
      filterNewAlertCandidates({
        candidates,
        existingKeys: new Set([getAlertDedupeKey(candidate)]),
      }),
    ).toEqual([]);
  });
});

