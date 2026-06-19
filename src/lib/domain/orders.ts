export type OrderStatusValue =
  | "PENDING"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELED"
  | "PAYMENT_FAILED"
  | "DISPUTED";

export type FulfillmentStatusValue =
  | "NOT_REQUIRED"
  | "UNFULFILLED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "DELAYED"
  | "CANCELED";

export type PaymentStatusValue =
  | "REQUIRES_PAYMENT"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "DISPUTED";

export type RefundStatusValue =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED";

export type StoreSourceValue =
  | "MOCK_STORE"
  | "SHOPIFY"
  | "WOOCOMMERCE"
  | "STRIPE_ONLY"
  | "CSV_IMPORT";

export type RefundSummaryStatus = RefundStatusValue | "MIXED" | "NONE";

export type StatusTone = "danger" | "info" | "neutral" | "success" | "warning";

export type OrderTableRow = {
  currency: string;
  customerEmail: string;
  customerName: string;
  fulfillmentStatus: FulfillmentStatusValue;
  id: string;
  orderNumber: string;
  paymentStatus: PaymentStatusValue;
  placedAt: string;
  refundAmountCents: number;
  refundStatus: RefundSummaryStatus;
  source: StoreSourceValue;
  status: OrderStatusValue;
  totalCents: number;
};

export type OrderTableFilters = {
  fulfillmentStatus: FulfillmentStatusValue | "all";
  orderStatus: OrderStatusValue | "all";
  paymentStatus: PaymentStatusValue | "all";
  searchText: string;
  source: StoreSourceValue | "all";
};

export type RefundSummaryInput = {
  amountCents: number;
  status: RefundStatusValue;
};

export const defaultOrderTableFilters: OrderTableFilters = {
  fulfillmentStatus: "all",
  orderStatus: "all",
  paymentStatus: "all",
  searchText: "",
  source: "all",
};

export const orderStatusLabels: Record<OrderStatusValue, string> = {
  CANCELED: "Canceled",
  DISPUTED: "Disputed",
  PAID: "Paid",
  PARTIALLY_REFUNDED: "Partially refunded",
  PAYMENT_FAILED: "Payment failed",
  PENDING: "Pending",
  REFUNDED: "Refunded",
};

export const fulfillmentStatusLabels: Record<FulfillmentStatusValue, string> = {
  CANCELED: "Canceled",
  DELAYED: "Delayed",
  FULFILLED: "Fulfilled",
  NOT_REQUIRED: "Not required",
  PARTIALLY_FULFILLED: "Partially fulfilled",
  UNFULFILLED: "Unfulfilled",
};

export const paymentStatusLabels: Record<PaymentStatusValue, string> = {
  CANCELED: "Canceled",
  DISPUTED: "Disputed",
  FAILED: "Failed",
  PARTIALLY_REFUNDED: "Partially refunded",
  PROCESSING: "Processing",
  REFUNDED: "Refunded",
  REQUIRES_PAYMENT: "Requires payment",
  SUCCEEDED: "Succeeded",
};

export const refundStatusLabels: Record<RefundSummaryStatus, string> = {
  CANCELED: "Canceled",
  FAILED: "Failed",
  MIXED: "Mixed",
  NONE: "No refund",
  PENDING: "Pending",
  PROCESSING: "Processing",
  SUCCEEDED: "Refunded",
};

export const sourceLabels: Record<StoreSourceValue, string> = {
  CSV_IMPORT: "CSV import",
  MOCK_STORE: "Mock store",
  SHOPIFY: "Shopify",
  STRIPE_ONLY: "Stripe only",
  WOOCOMMERCE: "WooCommerce",
};

export const orderStatusOptions = Object.keys(
  orderStatusLabels,
) as OrderStatusValue[];

export const fulfillmentStatusOptions = Object.keys(
  fulfillmentStatusLabels,
) as FulfillmentStatusValue[];

export const paymentStatusOptions = Object.keys(
  paymentStatusLabels,
) as PaymentStatusValue[];

export const sourceOptions = Object.keys(sourceLabels) as StoreSourceValue[];

export function getFilteredOrderRows(
  rows: readonly OrderTableRow[],
  filters: OrderTableFilters,
) {
  const search = filters.searchText.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesSearch =
      search.length === 0 ||
      row.orderNumber.toLowerCase().includes(search) ||
      row.customerName.toLowerCase().includes(search) ||
      row.customerEmail.toLowerCase().includes(search);

    return (
      matchesSearch &&
      matchesFilter(row.status, filters.orderStatus) &&
      matchesFilter(row.fulfillmentStatus, filters.fulfillmentStatus) &&
      matchesFilter(row.paymentStatus, filters.paymentStatus) &&
      matchesFilter(row.source, filters.source)
    );
  });
}

export function getPrimaryPaymentStatus(
  paymentStatuses: readonly PaymentStatusValue[],
  orderStatus: OrderStatusValue,
): PaymentStatusValue {
  if (paymentStatuses[0]) {
    return paymentStatuses[0];
  }

  return orderStatus === "CANCELED" ? "CANCELED" : "REQUIRES_PAYMENT";
}

export function getRefundSummary(refunds: readonly RefundSummaryInput[]) {
  if (refunds.length === 0) {
    return {
      amountCents: 0,
      status: "NONE" as const,
    };
  }

  const succeededAmountCents = refunds
    .filter((refund) => refund.status === "SUCCEEDED")
    .reduce((sum, refund) => sum + refund.amountCents, 0);
  const statuses = new Set(refunds.map((refund) => refund.status));
  const status =
    statuses.size === 1
      ? (refunds[0]?.status ?? "NONE")
      : getMixedRefundStatus(statuses);

  return {
    amountCents: succeededAmountCents,
    status,
  };
}

export function getOrderStatusTone(status: OrderStatusValue): StatusTone {
  if (status === "PAYMENT_FAILED" || status === "CANCELED") {
    return "danger";
  }

  if (status === "DISPUTED") {
    return "warning";
  }

  if (status === "PENDING") {
    return "neutral";
  }

  return "success";
}

export function getFulfillmentStatusTone(
  status: FulfillmentStatusValue,
): StatusTone {
  if (status === "DELAYED" || status === "UNFULFILLED") {
    return "warning";
  }

  if (status === "CANCELED") {
    return "danger";
  }

  if (status === "FULFILLED" || status === "NOT_REQUIRED") {
    return "success";
  }

  return "info";
}

export function getPaymentStatusTone(status: PaymentStatusValue): StatusTone {
  if (status === "FAILED" || status === "CANCELED") {
    return "danger";
  }

  if (status === "PROCESSING" || status === "REQUIRES_PAYMENT") {
    return "neutral";
  }

  if (status === "DISPUTED") {
    return "warning";
  }

  return "success";
}

export function getRefundStatusTone(status: RefundSummaryStatus): StatusTone {
  if (status === "FAILED" || status === "CANCELED") {
    return "danger";
  }

  if (status === "PENDING" || status === "PROCESSING" || status === "MIXED") {
    return "warning";
  }

  if (status === "SUCCEEDED") {
    return "success";
  }

  return "neutral";
}

function getMixedRefundStatus(
  statuses: ReadonlySet<RefundStatusValue>,
): RefundSummaryStatus {
  if (statuses.has("PROCESSING")) {
    return "PROCESSING";
  }

  if (statuses.has("PENDING")) {
    return "PENDING";
  }

  return "MIXED";
}

function matchesFilter<T extends string>(value: T, filter: T | "all") {
  return filter === "all" || value === filter;
}
