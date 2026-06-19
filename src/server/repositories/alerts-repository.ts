import { AlertSeverity, AlertStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AlertEvaluationRepository } from "@/server/services/alert-evaluation-service";

export const alertsRepository: AlertEvaluationRepository = {
  async createAlerts(candidates) {
    await prisma.alert.createMany({
      data: candidates.map((candidate) => ({
        customerId: candidate.customerId,
        description: candidate.description,
        disputeId: candidate.disputeId,
        orderId: candidate.orderId,
        paymentId: candidate.paymentId,
        refundId: candidate.refundId,
        ruleId: candidate.ruleId,
        severity: candidate.severity,
        status: AlertStatus.OPEN,
        title: candidate.title,
        triggeredAt: new Date(candidate.triggeredAt),
        type: candidate.type,
      })),
    });
  },
  async readEvaluationData() {
    const [rules, orders, refunds, payments, existingAlerts] =
      await Promise.all([
        prisma.alertRule.findMany({
          select: {
            enabled: true,
            failureCountThreshold: true,
            id: true,
            name: true,
            severity: true,
            thresholdCents: true,
            thresholdHours: true,
            type: true,
          },
          where: {
            enabled: true,
          },
        }),
        prisma.order.findMany({
          select: {
            customerId: true,
            fulfillmentStatus: true,
            hasPhysicalItems: true,
            id: true,
            orderNumber: true,
            placedAt: true,
            status: true,
          },
        }),
        prisma.refund.findMany({
          select: {
            amountCents: true,
            currency: true,
            id: true,
            order: {
              select: {
                customerId: true,
              },
            },
            orderId: true,
            providerRefundId: true,
            requestedAt: true,
            status: true,
          },
        }),
        prisma.payment.findMany({
          select: {
            createdAt: true,
            customerId: true,
            failedAt: true,
            id: true,
            providerPaymentId: true,
            status: true,
          },
        }),
        prisma.alert.findMany({
          select: {
            customerId: true,
            orderId: true,
            paymentId: true,
            refundId: true,
            ruleId: true,
            type: true,
          },
        }),
      ]);

    return {
      existingAlerts: existingAlerts.map((alert) => ({
        customerId: alert.customerId ?? undefined,
        orderId: alert.orderId ?? undefined,
        paymentId: alert.paymentId ?? undefined,
        refundId: alert.refundId ?? undefined,
        ruleId: alert.ruleId,
        type: alert.type,
      })),
      orders,
      payments,
      refunds: refunds.map((refund) => ({
        amountCents: refund.amountCents,
        currency: refund.currency,
        customerId: refund.order.customerId,
        id: refund.id,
        orderId: refund.orderId,
        providerRefundId: refund.providerRefundId,
        requestedAt: refund.requestedAt,
        status: refund.status,
      })),
      rules,
    };
  },
};

export async function readAlertList({
  severity,
  status,
}: {
  severity?: string;
  status?: string;
}) {
  return prisma.alert.findMany({
    orderBy: {
      triggeredAt: "desc",
    },
    select: {
      createdAt: true,
      customer: {
        select: {
          email: true,
          firstName: true,
          id: true,
          lastName: true,
        },
      },
      description: true,
      id: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
      payment: {
        select: {
          id: true,
          providerPaymentId: true,
        },
      },
      refund: {
        select: {
          id: true,
          providerRefundId: true,
        },
      },
      severity: true,
      status: true,
      title: true,
      triggeredAt: true,
      type: true,
    },
    where: {
      severity: isAlertSeverity(severity) ? severity : undefined,
      status: isAlertStatus(status) ? status : undefined,
    },
  });
}

function isAlertSeverity(value: string | undefined): value is AlertSeverity {
  return Object.values(AlertSeverity).includes(value as AlertSeverity);
}

function isAlertStatus(value: string | undefined): value is AlertStatus {
  return Object.values(AlertStatus).includes(value as AlertStatus);
}
