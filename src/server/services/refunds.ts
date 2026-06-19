import { readRefundsAndDisputes } from "@/server/repositories/refunds";

const openDisputeStatuses = new Set(["NEEDS_RESPONSE", "UNDER_REVIEW"]);

export type RefundsPageData = Awaited<ReturnType<typeof getRefundsPageData>>;

export async function getRefundsPageData() {
  const records = await readRefundsAndDisputes();
  const completedRefundAmountCents = records.refunds
    .filter((refund) => refund.status === "SUCCEEDED")
    .reduce((sum, refund) => sum + refund.amountCents, 0);
  const openDisputes = records.disputes.filter((dispute) =>
    openDisputeStatuses.has(dispute.status),
  );
  const disputedAmountCents = openDisputes.reduce(
    (sum, dispute) => sum + dispute.amountCents,
    0,
  );

  return {
    disputes: records.disputes.map((dispute) => ({
      amountCents: dispute.amountCents,
      currency: dispute.currency,
      customer: {
        email: dispute.order.customer.email,
        id: dispute.order.customer.id,
        name: getCustomerName(dispute.order.customer),
      },
      id: dispute.id,
      openedAt: dispute.openedAt.toISOString(),
      order: {
        id: dispute.order.id,
        orderNumber: dispute.order.orderNumber,
      },
      providerDisputeId: dispute.providerDisputeId,
      reason: dispute.reason,
      status: dispute.status,
    })),
    refunds: records.refunds.map((refund) => ({
      amountCents: refund.amountCents,
      currency: refund.currency,
      customer: {
        email: refund.order.customer.email,
        id: refund.order.customer.id,
        name: getCustomerName(refund.order.customer),
      },
      id: refund.id,
      order: {
        id: refund.order.id,
        orderNumber: refund.order.orderNumber,
      },
      processedAt: refund.processedAt?.toISOString() ?? null,
      providerRefundId: refund.providerRefundId,
      reason: refund.reason,
      requestedAt: refund.requestedAt.toISOString(),
      status: refund.status,
    })),
    summary: {
      completedRefundAmountCents,
      disputedAmountCents,
      openDisputes: openDisputes.length,
      refundCount: records.refunds.length,
    },
  };
}

function getCustomerName(customer: { firstName: string; lastName: string }) {
  return `${customer.firstName} ${customer.lastName}`;
}

