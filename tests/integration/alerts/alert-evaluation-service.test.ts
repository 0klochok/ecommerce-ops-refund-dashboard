import { describe, expect, it } from "vitest";
import type { AlertCandidate } from "@/lib/domain/alerts";
import {
  recalculateAlerts,
  type AlertEvaluationRepository,
} from "@/server/services/alert-evaluation-service";

describe("recalculateAlerts", () => {
  it("creates expected alert candidates from mixed demo-like data", async () => {
    const createdAlerts: AlertCandidate[] = [];
    const repository: AlertEvaluationRepository = {
      async createAlerts(candidates) {
        createdAlerts.push(...candidates);
      },
      async readEvaluationData() {
        return {
          existingAlerts: [
            {
              customerId: "customer-existing",
              ruleId: "rule-payment",
              type: "REPEATED_FAILED_PAYMENT",
            },
          ],
          orders: [
            {
              customerId: "customer-delay",
              fulfillmentStatus: "UNFULFILLED",
              hasPhysicalItems: true,
              id: "order-delay",
              orderNumber: "ORD-DELAY",
              placedAt: "2026-06-10T00:00:00.000Z",
              status: "PAID",
            },
          ],
          payments: [
            {
              createdAt: "2026-06-14T00:00:00.000Z",
              customerId: "customer-existing",
              failedAt: "2026-06-14T00:00:00.000Z",
              id: "payment-existing-1",
              providerPaymentId: "pi_existing_1",
              status: "FAILED",
            },
            {
              createdAt: "2026-06-15T00:00:00.000Z",
              customerId: "customer-existing",
              failedAt: "2026-06-15T00:00:00.000Z",
              id: "payment-existing-2",
              providerPaymentId: "pi_existing_2",
              status: "FAILED",
            },
          ],
          refunds: [
            {
              amountCents: 15_000,
              currency: "USD",
              customerId: "customer-refund",
              id: "refund-high",
              orderId: "order-refund",
              providerRefundId: "re_high",
              requestedAt: "2026-06-15T00:00:00.000Z",
              status: "SUCCEEDED",
            },
          ],
          rules: [
            {
              enabled: true,
              failureCountThreshold: null,
              id: "rule-delay",
              name: "Delay",
              severity: "HIGH",
              thresholdCents: null,
              thresholdHours: 72,
              type: "DELAYED_FULFILLMENT",
            },
            {
              enabled: true,
              failureCountThreshold: null,
              id: "rule-refund",
              name: "Refund",
              severity: "MEDIUM",
              thresholdCents: 10_000,
              thresholdHours: null,
              type: "HIGH_REFUND_AMOUNT",
            },
            {
              enabled: true,
              failureCountThreshold: 2,
              id: "rule-payment",
              name: "Payment",
              severity: "CRITICAL",
              thresholdCents: null,
              thresholdHours: null,
              type: "REPEATED_FAILED_PAYMENT",
            },
          ],
        };
      },
    };

    const summary = await recalculateAlerts({
      referenceDate: new Date("2026-06-15T00:00:00.000Z"),
      repository,
    });

    expect(summary).toMatchObject({
      created: 2,
      evaluated: 3,
      skippedExisting: 1,
    });
    expect(createdAlerts.map((alert) => alert.type).sort()).toEqual([
      "DELAYED_FULFILLMENT",
      "HIGH_REFUND_AMOUNT",
    ]);
  });
});

