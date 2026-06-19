import {
  DisputeStatus,
  PaymentStatus,
  RefundStatus,
} from "@/generated/prisma/client";
import {
  SUPPORTED_STRIPE_WEBHOOK_EVENT_TYPES,
  type StripeEventMapping,
  type StripeWebhookEvent,
  type SupportedStripeWebhookEventType,
} from "@/lib/stripe/types";

export function mapStripeWebhookEvent(
  event: StripeWebhookEvent,
): StripeEventMapping {
  if (!isSupportedStripeEventType(event.type)) {
    return {
      eventType: event.type,
      message: `Unsupported Stripe event type: ${event.type}`,
      supported: false,
    };
  }

  const object = event.data?.object;

  if (!isRecord(object)) {
    return {
      eventType: event.type,
      message: `Stripe event ${event.id} does not include a data.object payload.`,
      supported: false,
    };
  }

  if (event.type === "charge.refunded") {
    return {
      data: mapChargeRefunded(event, object),
      eventType: event.type,
      supported: true,
    };
  }

  if (event.type === "payment_intent.payment_failed") {
    return {
      data: mapPaymentIntentPaymentFailed(event, object),
      eventType: event.type,
      supported: true,
    };
  }

  return {
    data: mapChargeDisputeCreated(event, object),
    eventType: event.type,
    supported: true,
  };
}

export function isSupportedStripeEventType(
  value: string,
): value is SupportedStripeWebhookEventType {
  return SUPPORTED_STRIPE_WEBHOOK_EVENT_TYPES.includes(
    value as SupportedStripeWebhookEventType,
  );
}

function mapChargeRefunded(
  event: StripeWebhookEvent,
  charge: Record<string, unknown>,
) {
  const refund = getFirstRefund(charge);
  const status = mapRefundStatus(stringValue(refund?.status));
  const amountCents =
    numberValue(refund?.amount) ??
    numberValue(charge.amount_refunded) ??
    numberValue(charge.amount);
  const eventCreatedAt = unixSecondsToDate(event.created);

  return {
    amountCents,
    currency: normalizeCurrency(
      stringValue(refund?.currency) ?? stringValue(charge.currency),
    ),
    eventCreatedAt,
    processedAt: status === RefundStatus.SUCCEEDED ? eventCreatedAt : null,
    providerPaymentId: getExpandableId(
      refund?.payment_intent ?? charge.payment_intent,
    ),
    providerRefundId: stringValue(refund?.id),
    reason: stringValue(refund?.reason) ?? "Stripe test webhook refund.",
    status,
  };
}

function mapPaymentIntentPaymentFailed(
  event: StripeWebhookEvent,
  paymentIntent: Record<string, unknown>,
) {
  const error = isRecord(paymentIntent.last_payment_error)
    ? paymentIntent.last_payment_error
    : undefined;

  return {
    amountCents: numberValue(paymentIntent.amount),
    currency: normalizeCurrency(stringValue(paymentIntent.currency)),
    failedAt: unixSecondsToDate(event.created),
    failureCode:
      stringValue(error?.code) ??
      stringValue(error?.decline_code) ??
      "stripe_test_payment_failed",
    failureMessage:
      stringValue(error?.message) ??
      "Stripe test webhook reported a failed payment.",
    providerPaymentId: stringValue(paymentIntent.id),
    status: PaymentStatus.FAILED,
  };
}

function mapChargeDisputeCreated(
  event: StripeWebhookEvent,
  dispute: Record<string, unknown>,
) {
  const eventCreatedAt = unixSecondsToDate(event.created);

  return {
    amountCents: numberValue(dispute.amount),
    currency: normalizeCurrency(stringValue(dispute.currency)),
    eventCreatedAt,
    openedAt: unixSecondsToDate(numberValue(dispute.created) ?? event.created),
    providerDisputeId: stringValue(dispute.id),
    providerPaymentId: getExpandableId(dispute.payment_intent),
    reason: stringValue(dispute.reason) ?? "Stripe test webhook dispute.",
    status: mapDisputeStatus(stringValue(dispute.status)),
  };
}

function getFirstRefund(charge: Record<string, unknown>) {
  const refunds = isRecord(charge.refunds) ? charge.refunds : undefined;
  const data = Array.isArray(refunds?.data) ? refunds.data : [];
  const firstRefund = data.find(isRecord);

  return firstRefund;
}

function mapRefundStatus(value: string | null | undefined) {
  if (value === "failed") {
    return RefundStatus.FAILED;
  }

  if (value === "canceled" || value === "cancelled") {
    return RefundStatus.CANCELED;
  }

  if (value === "pending") {
    return RefundStatus.PENDING;
  }

  if (value === "requires_action" || value === "processing") {
    return RefundStatus.PROCESSING;
  }

  return RefundStatus.SUCCEEDED;
}

function mapDisputeStatus(value: string | null | undefined) {
  if (value === "under_review" || value === "warning_under_review") {
    return DisputeStatus.UNDER_REVIEW;
  }

  if (value === "won") {
    return DisputeStatus.WON;
  }

  if (value === "lost") {
    return DisputeStatus.LOST;
  }

  if (value === "closed") {
    return DisputeStatus.CLOSED;
  }

  return DisputeStatus.NEEDS_RESPONSE;
}

function getExpandableId(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (isRecord(value)) {
    return stringValue(value.id);
  }

  return null;
}

function normalizeCurrency(value: string | null | undefined) {
  return value?.toUpperCase() ?? "USD";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function unixSecondsToDate(value: number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000);
  }

  return new Date();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

