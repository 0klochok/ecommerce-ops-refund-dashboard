import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  RefundStatus,
  WebhookProcessingStatus,
  WebhookProvider,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  StoredWebhookEvent,
  StripeWebhookRepository,
} from "@/server/services/stripe-webhook-service";

const webhookEventSelect = {
  disputeId: true,
  errorMessage: true,
  eventType: true,
  id: true,
  paymentId: true,
  providerEventId: true,
  refundId: true,
  status: true,
} satisfies Prisma.WebhookEventSelect;

export const stripeWebhookRepository: StripeWebhookRepository = {
  async completeEvent(input) {
    return prisma.webhookEvent.update({
      data: {
        disputeId: input.disputeId,
        errorMessage: input.errorMessage,
        paymentId: input.paymentId,
        processedAt: input.processedAt,
        refundId: input.refundId,
        status: input.status,
      },
      select: webhookEventSelect,
      where: {
        id: input.id,
      },
    });
  },
  async createPendingEvent(input) {
    try {
      const event = await prisma.webhookEvent.create({
        data: {
          eventType: input.eventType,
          payload: input.payload as Prisma.InputJsonValue,
          provider: WebhookProvider.STRIPE,
          providerEventId: input.providerEventId,
          receivedAt: input.receivedAt,
          status: WebhookProcessingStatus.PENDING,
        },
        select: webhookEventSelect,
      });

      return {
        duplicate: false,
        event,
      };
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existingEvent = await prisma.webhookEvent.findUniqueOrThrow({
        select: webhookEventSelect,
        where: {
          providerEventId: input.providerEventId,
        },
      });

      return {
        duplicate: true,
        event: existingEvent,
      };
    }
  },
  async findPaymentByProviderPaymentId(providerPaymentId) {
    return prisma.payment.findUnique({
      select: {
        amountCents: true,
        customerId: true,
        id: true,
        orderId: true,
      },
      where: {
        providerPaymentId,
      },
    });
  },
  async markPaymentDisputed(input) {
    await prisma.$transaction([
      prisma.payment.update({
        data: {
          status: PaymentStatus.DISPUTED,
        },
        where: {
          id: input.paymentId,
        },
      }),
      prisma.order.update({
        data: {
          status: OrderStatus.DISPUTED,
        },
        where: {
          id: input.orderId,
        },
      }),
    ]);
  },
  async markPaymentFailed(input) {
    await prisma.$transaction([
      prisma.payment.update({
        data: {
          failedAt: input.failedAt,
          failureCode: input.failureCode,
          failureMessage: input.failureMessage,
          status: PaymentStatus.FAILED,
        },
        where: {
          id: input.paymentId,
        },
      }),
      prisma.order.update({
        data: {
          status: OrderStatus.PAYMENT_FAILED,
        },
        where: {
          id: input.orderId,
        },
      }),
    ]);
  },
  async upsertDisputeForPayment(input) {
    return prisma.dispute.upsert({
      create: {
        amountCents: input.amountCents,
        currency: input.currency,
        openedAt: input.openedAt,
        orderId: input.orderId,
        paymentId: input.paymentId,
        provider: PaymentProvider.STRIPE,
        providerDisputeId: input.providerDisputeId,
        reason: input.reason,
        status: input.status,
      },
      select: {
        id: true,
      },
      update: {
        amountCents: input.amountCents,
        currency: input.currency,
        openedAt: input.openedAt,
        paymentId: input.paymentId,
        reason: input.reason,
        status: input.status,
      },
      where: {
        providerDisputeId: input.providerDisputeId,
      },
    });
  },
  async upsertRefundForPayment(input) {
    return prisma.$transaction(async (transaction) => {
      const refund = await transaction.refund.upsert({
        create: {
          amountCents: input.amountCents,
          currency: input.currency,
          orderId: input.orderId,
          paymentId: input.paymentId,
          processedAt: input.processedAt,
          provider: PaymentProvider.STRIPE,
          providerRefundId: input.providerRefundId,
          reason: input.reason,
          requestedAt: input.requestedAt,
          status: input.status,
        },
        select: {
          id: true,
        },
        update: {
          amountCents: input.amountCents,
          currency: input.currency,
          paymentId: input.paymentId,
          processedAt: input.processedAt,
          reason: input.reason,
          requestedAt: input.requestedAt,
          status: input.status,
        },
        where: {
          providerRefundId: input.providerRefundId,
        },
      });

      if (input.status === RefundStatus.SUCCEEDED) {
        const isFullRefund = input.amountCents >= input.paymentAmountCents;
        const paymentStatus = isFullRefund
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;
        const orderStatus = isFullRefund
          ? OrderStatus.REFUNDED
          : OrderStatus.PARTIALLY_REFUNDED;

        await transaction.payment.update({
          data: {
            status: paymentStatus,
          },
          where: {
            id: input.paymentId,
          },
        });
        await transaction.order.update({
          data: {
            status: orderStatus,
          },
          where: {
            id: input.orderId,
          },
        });
      }

      return refund;
    });
  },
};

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export type { StoredWebhookEvent };

