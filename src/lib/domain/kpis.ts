export type KpiOrderStatus =
  | "PENDING"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELED"
  | "PAYMENT_FAILED"
  | "DISPUTED";

export type KpiFulfillmentStatus =
  | "NOT_REQUIRED"
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "DELAYED"
  | "CANCELED";

export type KpiPaymentStatus =
  | "REQUIRES_PAYMENT"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "DISPUTED";

export type KpiRefundStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

export type KpiDisputeStatus =
  | "NEEDS_RESPONSE"
  | "UNDER_REVIEW"
  | "WON"
  | "LOST"
  | "CLOSED";

export type KpiOrder = {
  fulfillmentStatus: KpiFulfillmentStatus;
  hasPhysicalItems: boolean;
  paymentStatus: KpiPaymentStatus;
  placedAt: Date | string;
  status: KpiOrderStatus;
  totalCents: number;
};

export type KpiRefund = {
  amountCents: number;
  status: KpiRefundStatus;
};

export type KpiPayment = {
  status: KpiPaymentStatus;
};

export type KpiDispute = {
  amountCents: number;
  status: KpiDisputeStatus;
};

export type CalculateDashboardKpisInput = {
  delayedFulfillmentThresholdHours?: number;
  disputes: readonly KpiDispute[];
  orders: readonly KpiOrder[];
  payments: readonly KpiPayment[];
  referenceDate: Date | string;
  refunds: readonly KpiRefund[];
};

export type DashboardKpis = {
  averageOrderValueCents: number;
  delayedFulfillmentCount: number;
  disputedAmountCents: number;
  failedPaymentCount: number;
  grossRevenueCents: number;
  orderCount: number;
  refundAmountCents: number;
  refundRate: number;
  unfulfilledOrderCount: number;
};

const paidPaymentStatuses = new Set<KpiPaymentStatus>([
  "SUCCEEDED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "DISPUTED",
]);

const completedRefundStatuses = new Set<KpiRefundStatus>([
  "SUCCEEDED",
  "COMPLETED",
]);

const activeDisputeStatuses = new Set<KpiDisputeStatus>([
  "NEEDS_RESPONSE",
  "UNDER_REVIEW",
]);

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function isCountedPaidOrder(order: KpiOrder) {
  return (
    order.status !== "CANCELED" && paidPaymentStatuses.has(order.paymentStatus)
  );
}

export function isCompletedRefund(refund: KpiRefund) {
  return completedRefundStatuses.has(refund.status);
}

export function isUnfulfilledPhysicalOrder(order: KpiOrder) {
  return (
    order.hasPhysicalItems &&
    order.status !== "CANCELED" &&
    order.fulfillmentStatus !== "FULFILLED"
  );
}

export function calculateDashboardKpis({
  delayedFulfillmentThresholdHours = 72,
  disputes,
  orders,
  payments,
  referenceDate,
  refunds,
}: CalculateDashboardKpisInput): DashboardKpis {
  const countedOrders = orders.filter(isCountedPaidOrder);

  // Revenue is gross paid order value, excluding canceled orders.
  const grossRevenueCents = countedOrders.reduce(
    (sum, order) => sum + order.totalCents,
    0,
  );

  // Refund amount is completed/succeeded refund amount only.
  const refundAmountCents = refunds
    .filter((refund) => completedRefundStatuses.has(refund.status))
    .reduce((sum, refund) => sum + refund.amountCents, 0);

  const unfulfilledOrders = orders.filter(isUnfulfilledPhysicalOrder);
  const referenceTime = toDate(referenceDate).getTime();
  const delayedThresholdMs = delayedFulfillmentThresholdHours * 60 * 60 * 1000;

  return {
    averageOrderValueCents:
      countedOrders.length === 0
        ? 0
        : Math.round(grossRevenueCents / countedOrders.length),
    delayedFulfillmentCount: unfulfilledOrders.filter(
      (order) => referenceTime - toDate(order.placedAt).getTime() > delayedThresholdMs,
    ).length,
    disputedAmountCents: disputes
      .filter((dispute) => activeDisputeStatuses.has(dispute.status))
      .reduce((sum, dispute) => sum + dispute.amountCents, 0),
    failedPaymentCount: payments.filter((payment) => payment.status === "FAILED")
      .length,
    grossRevenueCents,
    orderCount: countedOrders.length,
    refundAmountCents,
    refundRate:
      grossRevenueCents === 0 ? 0 : refundAmountCents / grossRevenueCents,
    unfulfilledOrderCount: unfulfilledOrders.length,
  };
}
