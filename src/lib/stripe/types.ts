import type {
  DisputeStatus,
  PaymentStatus,
  RefundStatus,
} from "@/generated/prisma/client";

export const SUPPORTED_STRIPE_WEBHOOK_EVENT_TYPES = [
  "charge.refunded",
  "payment_intent.payment_failed",
  "charge.dispute.created",
] as const;

export type SupportedStripeWebhookEventType =
  (typeof SUPPORTED_STRIPE_WEBHOOK_EVENT_TYPES)[number];

export type StripeWebhookEvent = {
  created?: number;
  data?: {
    object?: unknown;
  };
  id: string;
  object?: string;
  type: string;
};

export type StripeRefundMapping = {
  amountCents: number | null;
  currency: string;
  eventCreatedAt: Date;
  processedAt: Date | null;
  providerPaymentId: string | null;
  providerRefundId: string | null;
  reason: string;
  status: RefundStatus;
};

export type StripeFailedPaymentMapping = {
  amountCents: number | null;
  currency: string;
  failedAt: Date;
  failureCode: string | null;
  failureMessage: string;
  providerPaymentId: string | null;
  status: PaymentStatus;
};

export type StripeDisputeMapping = {
  amountCents: number | null;
  currency: string;
  eventCreatedAt: Date;
  openedAt: Date;
  providerDisputeId: string | null;
  providerPaymentId: string | null;
  reason: string;
  status: DisputeStatus;
};

export type StripeEventMapping =
  | {
      data: StripeRefundMapping;
      eventType: "charge.refunded";
      supported: true;
    }
  | {
      data: StripeFailedPaymentMapping;
      eventType: "payment_intent.payment_failed";
      supported: true;
    }
  | {
      data: StripeDisputeMapping;
      eventType: "charge.dispute.created";
      supported: true;
    }
  | {
      eventType: string;
      message: string;
      supported: false;
    };
