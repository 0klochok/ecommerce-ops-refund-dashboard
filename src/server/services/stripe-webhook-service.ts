import Stripe from "stripe";
import {
  WebhookProcessingStatus,
  type DisputeStatus,
  type RefundStatus,
} from "@/generated/prisma/client";
import { mapStripeWebhookEvent } from "@/lib/stripe/event-mapping";
import type {
  StripeDisputeMapping,
  StripeFailedPaymentMapping,
  StripeRefundMapping,
  StripeWebhookEvent,
} from "@/lib/stripe/types";

const stripe = new Stripe("sk_test_mock_local_signature_verification", {
  apiVersion: "2026-05-27.dahlia",
});

export type StoredWebhookEvent = {
  disputeId: string | null;
  errorMessage: string | null;
  eventType: string;
  id: string;
  paymentId: string | null;
  providerEventId: string;
  refundId: string | null;
  status: WebhookProcessingStatus;
};

export type StripeWebhookPayment = {
  amountCents: number;
  customerId: string;
  id: string;
  orderId: string;
};

export type StripeWebhookRepository = {
  completeEvent: (input: {
    disputeId?: string | null;
    errorMessage?: string | null;
    id: string;
    paymentId?: string | null;
    processedAt: Date;
    refundId?: string | null;
    status: WebhookProcessingStatus;
  }) => Promise<StoredWebhookEvent>;
  createPendingEvent: (input: {
    eventType: string;
    payload: unknown;
    providerEventId: string;
    receivedAt: Date;
  }) => Promise<{
    duplicate: boolean;
    event: StoredWebhookEvent;
  }>;
  findPaymentByProviderPaymentId: (
    providerPaymentId: string,
  ) => Promise<StripeWebhookPayment | null>;
  markPaymentDisputed: (input: {
    orderId: string;
    paymentId: string;
  }) => Promise<void>;
  markPaymentFailed: (input: {
    failedAt: Date;
    failureCode: string | null;
    failureMessage: string;
    orderId: string;
    paymentId: string;
  }) => Promise<void>;
  upsertDisputeForPayment: (input: {
    amountCents: number;
    currency: string;
    openedAt: Date;
    orderId: string;
    paymentId: string;
    providerDisputeId: string;
    reason: string;
    status: DisputeStatus;
  }) => Promise<{ id: string }>;
  upsertRefundForPayment: (input: {
    amountCents: number;
    currency: string;
    orderId: string;
    paymentAmountCents: number;
    paymentId: string;
    processedAt: Date | null;
    providerRefundId: string;
    reason: string;
    requestedAt: Date;
    status: RefundStatus;
  }) => Promise<{ id: string }>;
};

export type StripeWebhookProcessingResult = {
  duplicate: boolean;
  eventId: string;
  eventType: string;
  processingStatus: WebhookProcessingStatus;
  received: true;
};

export async function handleStripeWebhookRequest({
  recalculateAlerts,
  repository,
  request,
  webhookSecret = process.env.STRIPE_WEBHOOK_SECRET,
}: {
  recalculateAlerts?: () => Promise<void>;
  repository?: StripeWebhookRepository;
  request: Request;
  webhookSecret?: string;
}) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      {
        error: "Missing Stripe signature header.",
      },
      {
        status: 400,
      },
    );
  }

  if (!webhookSecret) {
    return Response.json(
      {
        error: "Missing STRIPE_WEBHOOK_SECRET.",
      },
      {
        status: 400,
      },
    );
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return Response.json(
      {
        error: "Unable to read Stripe webhook body.",
      },
      {
        status: 400,
      },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return Response.json(
      {
        error: "Invalid Stripe webhook signature or payload.",
      },
      {
        status: 400,
      },
    );
  }

  if (!isWebhookEventShape(event)) {
    return Response.json(
      {
        error: "Unsupported Stripe webhook payload.",
      },
      {
        status: 400,
      },
    );
  }

  const result = await processStripeWebhookEvent({
    event,
    recalculateAlerts,
    repository,
  });

  return Response.json(result);
}

export async function processStripeWebhookEvent({
  event,
  now = new Date(),
  recalculateAlerts,
  repository,
}: {
  event: StripeWebhookEvent;
  now?: Date;
  recalculateAlerts?: () => Promise<void>;
  repository?: StripeWebhookRepository;
}): Promise<StripeWebhookProcessingResult> {
  const activeRepository =
    repository ?? (await getDefaultStripeWebhookRepository());
  const pendingEvent = await activeRepository.createPendingEvent({
    eventType: event.type,
    payload: event,
    providerEventId: event.id,
    receivedAt: now,
  });

  if (pendingEvent.duplicate) {
    return {
      duplicate: true,
      eventId: pendingEvent.event.providerEventId,
      eventType: pendingEvent.event.eventType,
      processingStatus: pendingEvent.event.status,
      received: true,
    };
  }

  try {
    const mapping = mapStripeWebhookEvent(event);

    if (!mapping.supported) {
      const storedEvent = await activeRepository.completeEvent({
        errorMessage: mapping.message,
        id: pendingEvent.event.id,
        processedAt: now,
        status: WebhookProcessingStatus.IGNORED,
      });

      return buildResult(storedEvent, false);
    }

    if (mapping.eventType === "charge.refunded") {
      return buildResult(
        await processRefundedCharge({
          eventId: pendingEvent.event.id,
          mapping: mapping.data,
          now,
          recalculateAlerts,
          repository: activeRepository,
        }),
        false,
      );
    }

    if (mapping.eventType === "payment_intent.payment_failed") {
      return buildResult(
        await processFailedPaymentIntent({
          eventId: pendingEvent.event.id,
          mapping: mapping.data,
          now,
          recalculateAlerts,
          repository: activeRepository,
        }),
        false,
      );
    }

    return buildResult(
      await processCreatedDispute({
        eventId: pendingEvent.event.id,
        mapping: mapping.data,
        now,
        repository: activeRepository,
      }),
      false,
    );
  } catch (error) {
    const storedEvent = await activeRepository.completeEvent({
      errorMessage:
        error instanceof Error
          ? error.message
          : "Stripe webhook processing failed with an unknown error.",
      id: pendingEvent.event.id,
      processedAt: now,
      status: WebhookProcessingStatus.FAILED,
    });

    return buildResult(storedEvent, false);
  }
}

async function processRefundedCharge({
  eventId,
  mapping,
  now,
  recalculateAlerts,
  repository,
}: {
  eventId: string;
  mapping: StripeRefundMapping;
  now: Date;
  recalculateAlerts?: () => Promise<void>;
  repository: StripeWebhookRepository;
}) {
  if (
    !mapping.providerPaymentId ||
    !mapping.providerRefundId ||
    mapping.amountCents === null
  ) {
    return repository.completeEvent({
      errorMessage:
        "charge.refunded was stored but skipped because payment intent, refund ID, or amount was missing.",
      id: eventId,
      processedAt: now,
      status: WebhookProcessingStatus.IGNORED,
    });
  }

  const payment = await repository.findPaymentByProviderPaymentId(
    mapping.providerPaymentId,
  );

  if (!payment) {
    return repository.completeEvent({
      errorMessage: `charge.refunded could not be matched to payment ${mapping.providerPaymentId}.`,
      id: eventId,
      processedAt: now,
      status: WebhookProcessingStatus.IGNORED,
    });
  }

  const refund = await repository.upsertRefundForPayment({
    amountCents: mapping.amountCents,
    currency: mapping.currency,
    orderId: payment.orderId,
    paymentAmountCents: payment.amountCents,
    paymentId: payment.id,
    processedAt: mapping.processedAt,
    providerRefundId: mapping.providerRefundId,
    reason: mapping.reason,
    requestedAt: mapping.eventCreatedAt,
    status: mapping.status,
  });

  await recalculateOperationalAlerts(recalculateAlerts);

  return repository.completeEvent({
    id: eventId,
    paymentId: payment.id,
    processedAt: now,
    refundId: refund.id,
    status: WebhookProcessingStatus.PROCESSED,
  });
}

async function processFailedPaymentIntent({
  eventId,
  mapping,
  now,
  recalculateAlerts,
  repository,
}: {
  eventId: string;
  mapping: StripeFailedPaymentMapping;
  now: Date;
  recalculateAlerts?: () => Promise<void>;
  repository: StripeWebhookRepository;
}) {
  if (!mapping.providerPaymentId) {
    return repository.completeEvent({
      errorMessage:
        "payment_intent.payment_failed was stored but skipped because payment intent ID was missing.",
      id: eventId,
      processedAt: now,
      status: WebhookProcessingStatus.IGNORED,
    });
  }

  const payment = await repository.findPaymentByProviderPaymentId(
    mapping.providerPaymentId,
  );

  if (!payment) {
    return repository.completeEvent({
      errorMessage: `payment_intent.payment_failed could not be matched to payment ${mapping.providerPaymentId}.`,
      id: eventId,
      processedAt: now,
      status: WebhookProcessingStatus.IGNORED,
    });
  }

  await repository.markPaymentFailed({
    failedAt: mapping.failedAt,
    failureCode: mapping.failureCode,
    failureMessage: mapping.failureMessage,
    orderId: payment.orderId,
    paymentId: payment.id,
  });
  await recalculateOperationalAlerts(recalculateAlerts);

  return repository.completeEvent({
    id: eventId,
    paymentId: payment.id,
    processedAt: now,
    status: WebhookProcessingStatus.PROCESSED,
  });
}

async function processCreatedDispute({
  eventId,
  mapping,
  now,
  repository,
}: {
  eventId: string;
  mapping: StripeDisputeMapping;
  now: Date;
  repository: StripeWebhookRepository;
}) {
  if (
    !mapping.providerPaymentId ||
    !mapping.providerDisputeId ||
    mapping.amountCents === null
  ) {
    return repository.completeEvent({
      errorMessage:
        "charge.dispute.created was stored but skipped because payment intent, dispute ID, or amount was missing.",
      id: eventId,
      processedAt: now,
      status: WebhookProcessingStatus.IGNORED,
    });
  }

  const payment = await repository.findPaymentByProviderPaymentId(
    mapping.providerPaymentId,
  );

  if (!payment) {
    return repository.completeEvent({
      errorMessage: `charge.dispute.created could not be matched to payment ${mapping.providerPaymentId}.`,
      id: eventId,
      processedAt: now,
      status: WebhookProcessingStatus.IGNORED,
    });
  }

  const dispute = await repository.upsertDisputeForPayment({
    amountCents: mapping.amountCents,
    currency: mapping.currency,
    openedAt: mapping.openedAt,
    orderId: payment.orderId,
    paymentId: payment.id,
    providerDisputeId: mapping.providerDisputeId,
    reason: mapping.reason,
    status: mapping.status,
  });

  await repository.markPaymentDisputed({
    orderId: payment.orderId,
    paymentId: payment.id,
  });

  return repository.completeEvent({
    disputeId: dispute.id,
    id: eventId,
    paymentId: payment.id,
    processedAt: now,
    status: WebhookProcessingStatus.PROCESSED,
  });
}

async function recalculateOperationalAlerts(recalculateAlerts?: () => Promise<void>) {
  if (recalculateAlerts) {
    await recalculateAlerts();
    return;
  }

  const { recalculateAlerts: defaultRecalculateAlerts } = await import(
    "@/server/services/alert-evaluation-service"
  );

  await defaultRecalculateAlerts();
}

async function getDefaultStripeWebhookRepository() {
  const { stripeWebhookRepository } = await import(
    "@/server/repositories/webhook-events-repository"
  );

  return stripeWebhookRepository;
}

function buildResult(
  event: StoredWebhookEvent,
  duplicate: boolean,
): StripeWebhookProcessingResult {
  return {
    duplicate,
    eventId: event.providerEventId,
    eventType: event.eventType,
    processingStatus: event.status,
    received: true,
  };
}

function isWebhookEventShape(event: unknown): event is StripeWebhookEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "id" in event &&
    "type" in event &&
    typeof (event as { id?: unknown }).id === "string" &&
    typeof (event as { type?: unknown }).type === "string"
  );
}
