import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  OrderStatus,
  PaymentStatus,
  WebhookProcessingStatus,
} from "@/generated/prisma/client";
import {
  handleStripeWebhookRequest,
  type StoredWebhookEvent,
  type StripeWebhookPayment,
  type StripeWebhookRepository,
} from "@/server/services/stripe-webhook-service";
import {
  mockChargeDisputeCreatedEvent,
  mockChargeRefundedEvent,
  mockPaymentIntentPaymentFailedEvent,
} from "@/lib/test-data/stripe-events";

const WEBHOOK_SECRET = "whsec_mock_test_secret";
const stripe = new Stripe("sk_test_mock_local_signature_verification", {
  apiVersion: "2026-05-27.dahlia",
});

type FakeRepository = StripeWebhookRepository & {
  disputes: unknown[];
  events: Map<string, StoredWebhookEvent>;
  failedPayments: unknown[];
  orderStatuses: Map<string, OrderStatus>;
  paymentStatuses: Map<string, PaymentStatus>;
  refunds: unknown[];
};

function createFakeRepository({
  payments = [
    {
      amountCents: 10_000,
      customerId: "customer-1",
      id: "payment-1",
      orderId: "order-1",
      providerPaymentId: "pi_mock_000001",
    },
    {
      amountCents: 7_599,
      customerId: "customer-2",
      id: "payment-2",
      orderId: "order-2",
      providerPaymentId: "pi_mock_000002",
    },
    {
      amountCents: 12_900,
      customerId: "customer-3",
      id: "payment-3",
      orderId: "order-3",
      providerPaymentId: "pi_mock_000003",
    },
  ],
}: {
  payments?: (StripeWebhookPayment & { providerPaymentId: string })[];
} = {}): FakeRepository {
  const events = new Map<string, StoredWebhookEvent>();
  const paymentsByProviderId = new Map(
    payments.map((payment) => [payment.providerPaymentId, payment]),
  );
  const refunds: unknown[] = [];
  const failedPayments: unknown[] = [];
  const disputes: unknown[] = [];
  const paymentStatuses = new Map<string, PaymentStatus>();
  const orderStatuses = new Map<string, OrderStatus>();

  return {
    async completeEvent(input) {
      const event = Array.from(events.values()).find(
        (item) => item.id === input.id,
      );

      if (!event) {
        throw new Error(`Missing stored event ${input.id}.`);
      }

      const updatedEvent: StoredWebhookEvent = {
        ...event,
        disputeId: input.disputeId ?? event.disputeId,
        errorMessage: input.errorMessage ?? null,
        paymentId: input.paymentId ?? event.paymentId,
        refundId: input.refundId ?? event.refundId,
        status: input.status,
      };

      events.set(updatedEvent.providerEventId, updatedEvent);

      return updatedEvent;
    },
    async createPendingEvent(input) {
      const existingEvent = events.get(input.providerEventId);

      if (existingEvent) {
        return {
          duplicate: true,
          event: existingEvent,
        };
      }

      const event: StoredWebhookEvent = {
        disputeId: null,
        errorMessage: null,
        eventType: input.eventType,
        id: `webhook-${events.size + 1}`,
        paymentId: null,
        providerEventId: input.providerEventId,
        refundId: null,
        status: WebhookProcessingStatus.PENDING,
      };

      events.set(input.providerEventId, event);

      return {
        duplicate: false,
        event,
      };
    },
    async findPaymentByProviderPaymentId(providerPaymentId) {
      const payment = paymentsByProviderId.get(providerPaymentId);

      if (!payment) {
        return null;
      }

      return {
        amountCents: payment.amountCents,
        customerId: payment.customerId,
        id: payment.id,
        orderId: payment.orderId,
      };
    },
    async markPaymentDisputed(input) {
      paymentStatuses.set(input.paymentId, PaymentStatus.DISPUTED);
      orderStatuses.set(input.orderId, OrderStatus.DISPUTED);
    },
    async markPaymentFailed(input) {
      failedPayments.push(input);
      paymentStatuses.set(input.paymentId, PaymentStatus.FAILED);
      orderStatuses.set(input.orderId, OrderStatus.PAYMENT_FAILED);
    },
    async upsertDisputeForPayment(input) {
      const id = `dispute-${disputes.length + 1}`;
      disputes.push({
        id,
        ...input,
      });

      return { id };
    },
    async upsertRefundForPayment(input) {
      const id = `refund-${refunds.length + 1}`;
      refunds.push({
        id,
        ...input,
      });

      paymentStatuses.set(
        input.paymentId,
        input.amountCents >= input.paymentAmountCents
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED,
      );
      orderStatuses.set(
        input.orderId,
        input.amountCents >= input.paymentAmountCents
          ? OrderStatus.REFUNDED
          : OrderStatus.PARTIALLY_REFUNDED,
      );

      return { id };
    },
    disputes,
    events,
    failedPayments,
    orderStatuses,
    paymentStatuses,
    refunds,
  };
}

function createSignedRequest(payload: unknown, secret = WEBHOOK_SECRET) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
  });

  return new Request("http://localhost/api/webhooks/stripe", {
    body,
    headers: {
      "stripe-signature": signature,
    },
    method: "POST",
  });
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("handleStripeWebhookRequest", () => {
  it("accepts a valid signed charge.refunded event", async () => {
    const repository = createFakeRepository();
    const response = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository,
      request: createSignedRequest(mockChargeRefundedEvent),
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({
      duplicate: false,
      eventId: "evt_mock_charge_refunded_000001",
      eventType: "charge.refunded",
      processingStatus: WebhookProcessingStatus.PROCESSED,
      received: true,
    });
    expect(repository.refunds).toHaveLength(1);
    expect(repository.paymentStatuses.get("payment-1")).toBe(
      PaymentStatus.PARTIALLY_REFUNDED,
    );
  });

  it("rejects an invalid signature", async () => {
    const response = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository: createFakeRepository(),
      request: createSignedRequest(mockChargeRefundedEvent, "whsec_wrong"),
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: "Invalid Stripe webhook signature or payload.",
    });
  });

  it("rejects a missing signature", async () => {
    const response = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository: createFakeRepository(),
      request: new Request("http://localhost/api/webhooks/stripe", {
        body: JSON.stringify(mockChargeRefundedEvent),
        method: "POST",
      }),
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: "Missing Stripe signature header.",
    });
  });

  it("rejects a missing webhook secret", async () => {
    const response = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository: createFakeRepository(),
      request: createSignedRequest(mockChargeRefundedEvent),
      webhookSecret: "",
    });

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: "Missing STRIPE_WEBHOOK_SECRET.",
    });
  });

  it("rejects a malformed signed body", async () => {
    const response = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository: createFakeRepository(),
      request: createSignedRequest("{not-json"),
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: "Invalid Stripe webhook signature or payload.",
    });
  });

  it("keeps duplicate event delivery idempotent", async () => {
    const repository = createFakeRepository();

    await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository,
      request: createSignedRequest(mockChargeRefundedEvent),
      webhookSecret: WEBHOOK_SECRET,
    });
    const duplicateResponse = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository,
      request: createSignedRequest(mockChargeRefundedEvent),
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(await readJson(duplicateResponse)).toMatchObject({
      duplicate: true,
      eventId: "evt_mock_charge_refunded_000001",
      processingStatus: WebhookProcessingStatus.PROCESSED,
    });
    expect(repository.events.size).toBe(1);
    expect(repository.refunds).toHaveLength(1);
  });

  it("maps payment_intent.payment_failed to failed payment behavior", async () => {
    const repository = createFakeRepository();
    const response = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository,
      request: createSignedRequest(mockPaymentIntentPaymentFailedEvent),
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(await readJson(response)).toMatchObject({
      eventType: "payment_intent.payment_failed",
      processingStatus: WebhookProcessingStatus.PROCESSED,
    });
    expect(repository.failedPayments).toHaveLength(1);
    expect(repository.paymentStatuses.get("payment-2")).toBe(
      PaymentStatus.FAILED,
    );
    expect(repository.orderStatuses.get("order-2")).toBe(
      OrderStatus.PAYMENT_FAILED,
    );
  });

  it("maps charge.dispute.created to dispute behavior", async () => {
    const repository = createFakeRepository();
    const response = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository,
      request: createSignedRequest(mockChargeDisputeCreatedEvent),
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(await readJson(response)).toMatchObject({
      eventType: "charge.dispute.created",
      processingStatus: WebhookProcessingStatus.PROCESSED,
    });
    expect(repository.disputes).toHaveLength(1);
    expect(repository.paymentStatuses.get("payment-3")).toBe(
      PaymentStatus.DISPUTED,
    );
    expect(repository.orderStatuses.get("order-3")).toBe(OrderStatus.DISPUTED);
  });

  it("stores unknown valid event types safely as ignored", async () => {
    const repository = createFakeRepository();
    const response = await handleStripeWebhookRequest({
      recalculateAlerts: async () => {},
      repository,
      request: createSignedRequest({
        data: {
          object: {
            id: "cs_mock_000001",
            object: "checkout.session",
          },
        },
        id: "evt_mock_unknown_000001",
        livemode: false,
        object: "event",
        type: "checkout.session.completed",
      }),
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(await readJson(response)).toMatchObject({
      duplicate: false,
      eventId: "evt_mock_unknown_000001",
      eventType: "checkout.session.completed",
      processingStatus: WebhookProcessingStatus.IGNORED,
      received: true,
    });
    expect(repository.events.get("evt_mock_unknown_000001")).toMatchObject({
      errorMessage: "Unsupported Stripe event type: checkout.session.completed",
      status: WebhookProcessingStatus.IGNORED,
    });
  });
});
