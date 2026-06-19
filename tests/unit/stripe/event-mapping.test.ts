import { describe, expect, it } from "vitest";
import {
  DisputeStatus,
  PaymentStatus,
  RefundStatus,
} from "@/generated/prisma/client";
import { mapStripeWebhookEvent } from "@/lib/stripe/event-mapping";
import {
  mockChargeDisputeCreatedEvent,
  mockChargeRefundedEvent,
  mockPaymentIntentPaymentFailedEvent,
} from "@/lib/test-data/stripe-events";

describe("mapStripeWebhookEvent", () => {
  it("maps charge.refunded into refund data", () => {
    const mapping = mapStripeWebhookEvent(mockChargeRefundedEvent);

    expect(mapping).toMatchObject({
      eventType: "charge.refunded",
      supported: true,
    });

    if (!mapping.supported || mapping.eventType !== "charge.refunded") {
      throw new Error("Expected a charge.refunded mapping.");
    }

    expect(mapping.data).toMatchObject({
      amountCents: 4_200,
      currency: "USD",
      providerPaymentId: "pi_mock_000001",
      providerRefundId: "re_mock_phase4_000001",
      reason: "requested_by_customer",
      status: RefundStatus.SUCCEEDED,
    });
    expect(mapping.data.processedAt).toBeInstanceOf(Date);
  });

  it("maps payment_intent.payment_failed into failed payment behavior", () => {
    const mapping = mapStripeWebhookEvent(mockPaymentIntentPaymentFailedEvent);

    expect(mapping).toMatchObject({
      eventType: "payment_intent.payment_failed",
      supported: true,
    });

    if (
      !mapping.supported ||
      mapping.eventType !== "payment_intent.payment_failed"
    ) {
      throw new Error("Expected a payment_intent.payment_failed mapping.");
    }

    expect(mapping.data).toMatchObject({
      amountCents: 7_599,
      currency: "USD",
      failureCode: "card_declined",
      failureMessage: "Mock card declined for deterministic webhook tests.",
      providerPaymentId: "pi_mock_000002",
      status: PaymentStatus.FAILED,
    });
  });

  it("maps charge.dispute.created into dispute behavior", () => {
    const mapping = mapStripeWebhookEvent(mockChargeDisputeCreatedEvent);

    expect(mapping).toMatchObject({
      eventType: "charge.dispute.created",
      supported: true,
    });

    if (!mapping.supported || mapping.eventType !== "charge.dispute.created") {
      throw new Error("Expected a charge.dispute.created mapping.");
    }

    expect(mapping.data).toMatchObject({
      amountCents: 12_900,
      currency: "USD",
      providerDisputeId: "dp_mock_phase4_000001",
      providerPaymentId: "pi_mock_000003",
      reason: "product_not_received",
      status: DisputeStatus.NEEDS_RESPONSE,
    });
  });

  it("marks unknown valid event types as unsupported", () => {
    const mapping = mapStripeWebhookEvent({
      data: {
        object: {
          id: "cs_mock_000001",
          object: "checkout.session",
        },
      },
      id: "evt_mock_unknown_000001",
      object: "event",
      type: "checkout.session.completed",
    });

    expect(mapping).toEqual({
      eventType: "checkout.session.completed",
      message: "Unsupported Stripe event type: checkout.session.completed",
      supported: false,
    });
  });
});

