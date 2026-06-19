export type AlertTypeValue =
  | "DELAYED_FULFILLMENT"
  | "HIGH_REFUND_AMOUNT"
  | "REPEATED_FAILED_PAYMENT";

export type AlertSeverityValue = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatusValue =
  | "ACKNOWLEDGED"
  | "DISMISSED"
  | "OPEN"
  | "RESOLVED";

export type AlertRuleConfig = {
  enabled: boolean;
  failureCountThreshold: number | null;
  id: string;
  name: string;
  severity: AlertSeverityValue;
  thresholdCents: number | null;
  thresholdHours: number | null;
  type: AlertTypeValue;
};

export type AlertEvaluationOrder = {
  customerId: string;
  fulfillmentStatus: string;
  hasPhysicalItems: boolean;
  id: string;
  orderNumber: string;
  placedAt: Date | string;
  status: string;
};

export type AlertEvaluationRefund = {
  amountCents: number;
  currency: string;
  customerId: string;
  id: string;
  orderId: string;
  providerRefundId: string;
  requestedAt: Date | string;
  status: string;
};

export type AlertEvaluationPayment = {
  createdAt: Date | string;
  customerId: string;
  failedAt: Date | string | null;
  id: string;
  providerPaymentId: string;
  status: string;
};

export type AlertCandidate = {
  customerId?: string;
  description: string;
  disputeId?: string;
  orderId?: string;
  paymentId?: string;
  refundId?: string;
  ruleId: string;
  severity: AlertSeverityValue;
  title: string;
  triggeredAt: string;
  type: AlertTypeValue;
};

export const alertTypeLabels: Record<AlertTypeValue, string> = {
  DELAYED_FULFILLMENT: "Delayed fulfillment",
  HIGH_REFUND_AMOUNT: "High refund amount",
  REPEATED_FAILED_PAYMENT: "Repeated failed payment",
};

export const alertSeverityLabels: Record<AlertSeverityValue, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  LOW: "Low",
  MEDIUM: "Medium",
};

export const alertStatusLabels: Record<AlertStatusValue, string> = {
  ACKNOWLEDGED: "Acknowledged",
  DISMISSED: "Dismissed",
  OPEN: "Open",
  RESOLVED: "Resolved",
};

export function buildAlertCandidates({
  orders,
  payments,
  referenceDate,
  refunds,
  rules,
}: {
  orders: readonly AlertEvaluationOrder[];
  payments: readonly AlertEvaluationPayment[];
  referenceDate: Date | string;
  refunds: readonly AlertEvaluationRefund[];
  rules: readonly AlertRuleConfig[];
}) {
  const enabledRules = rules.filter((rule) => rule.enabled);
  const candidates = [
    ...buildDelayedFulfillmentCandidates({
      orders,
      referenceDate,
      rule: enabledRules.find((rule) => rule.type === "DELAYED_FULFILLMENT"),
    }),
    ...buildHighRefundCandidates({
      refunds,
      rule: enabledRules.find((rule) => rule.type === "HIGH_REFUND_AMOUNT"),
    }),
    ...buildRepeatedFailedPaymentCandidates({
      payments,
      rule: enabledRules.find((rule) => rule.type === "REPEATED_FAILED_PAYMENT"),
    }),
  ];

  return dedupeAlertCandidates(candidates);
}

export function dedupeAlertCandidates(
  candidates: readonly AlertCandidate[],
) {
  const seenKeys = new Set<string>();
  const dedupedCandidates: AlertCandidate[] = [];

  for (const candidate of candidates) {
    const key = getAlertDedupeKey(candidate);

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    dedupedCandidates.push(candidate);
  }

  return dedupedCandidates;
}

export function filterNewAlertCandidates({
  candidates,
  existingKeys,
}: {
  candidates: readonly AlertCandidate[];
  existingKeys: ReadonlySet<string>;
}) {
  return candidates.filter(
    (candidate) => !existingKeys.has(getAlertDedupeKey(candidate)),
  );
}

export function getAlertDedupeKey(
  alert: Pick<
    AlertCandidate,
    "customerId" | "orderId" | "paymentId" | "refundId" | "ruleId" | "type"
  >,
) {
  if (alert.type === "DELAYED_FULFILLMENT") {
    return `${alert.ruleId}:order:${alert.orderId ?? "missing"}`;
  }

  if (alert.type === "HIGH_REFUND_AMOUNT") {
    return `${alert.ruleId}:refund:${alert.refundId ?? "missing"}`;
  }

  return `${alert.ruleId}:customer:${alert.customerId ?? "missing"}`;
}

export function summarizeAlertCandidatesByType(
  candidates: readonly Pick<AlertCandidate, "type">[],
) {
  return {
    DELAYED_FULFILLMENT: candidates.filter(
      (candidate) => candidate.type === "DELAYED_FULFILLMENT",
    ).length,
    HIGH_REFUND_AMOUNT: candidates.filter(
      (candidate) => candidate.type === "HIGH_REFUND_AMOUNT",
    ).length,
    REPEATED_FAILED_PAYMENT: candidates.filter(
      (candidate) => candidate.type === "REPEATED_FAILED_PAYMENT",
    ).length,
  };
}

function buildDelayedFulfillmentCandidates({
  orders,
  referenceDate,
  rule,
}: {
  orders: readonly AlertEvaluationOrder[];
  referenceDate: Date | string;
  rule: AlertRuleConfig | undefined;
}) {
  if (!rule) {
    return [];
  }

  const thresholdHours = rule.thresholdHours ?? 72;
  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  const referenceTime = toDate(referenceDate).getTime();

  return orders
    .filter(
      (order) =>
        order.hasPhysicalItems &&
        order.status !== "CANCELED" &&
        !["CANCELED", "FULFILLED", "NOT_REQUIRED"].includes(
          order.fulfillmentStatus,
        ) &&
        referenceTime - toDate(order.placedAt).getTime() > thresholdMs,
    )
    .map(
      (order): AlertCandidate => ({
        customerId: order.customerId,
        description: `${order.orderNumber} is past the ${thresholdHours}-hour demo fulfillment threshold.`,
        orderId: order.id,
        ruleId: rule.id,
        severity: rule.severity,
        title: "Delayed fulfillment needs review",
        triggeredAt: toDate(referenceDate).toISOString(),
        type: rule.type,
      }),
    );
}

function buildHighRefundCandidates({
  refunds,
  rule,
}: {
  refunds: readonly AlertEvaluationRefund[];
  rule: AlertRuleConfig | undefined;
}) {
  if (!rule) {
    return [];
  }

  const thresholdCents = rule.thresholdCents ?? 10_000;

  return refunds
    .filter(
      (refund) =>
        refund.status === "SUCCEEDED" && refund.amountCents >= thresholdCents,
    )
    .map(
      (refund): AlertCandidate => ({
        customerId: refund.customerId,
        description: `${refund.providerRefundId} exceeds the ${thresholdCents} cent demo high-refund threshold.`,
        orderId: refund.orderId,
        refundId: refund.id,
        ruleId: rule.id,
        severity: rule.severity,
        title: "High refund amount",
        triggeredAt: toDate(refund.requestedAt).toISOString(),
        type: rule.type,
      }),
    );
}

function buildRepeatedFailedPaymentCandidates({
  payments,
  rule,
}: {
  payments: readonly AlertEvaluationPayment[];
  rule: AlertRuleConfig | undefined;
}) {
  if (!rule) {
    return [];
  }

  const failureThreshold = rule.failureCountThreshold ?? 2;
  const failedPaymentsByCustomer = new Map<string, AlertEvaluationPayment[]>();

  for (const payment of payments) {
    if (payment.status !== "FAILED") {
      continue;
    }

    failedPaymentsByCustomer.set(payment.customerId, [
      ...(failedPaymentsByCustomer.get(payment.customerId) ?? []),
      payment,
    ]);
  }

  const candidates: AlertCandidate[] = [];

  for (const [customerId, failedPayments] of failedPaymentsByCustomer) {
    if (failedPayments.length < failureThreshold) {
      continue;
    }

    const sortedPayments = [...failedPayments].sort(
      (firstPayment, secondPayment) =>
        toDate(secondPayment.failedAt ?? secondPayment.createdAt).getTime() -
        toDate(firstPayment.failedAt ?? firstPayment.createdAt).getTime(),
    );
    const latestPayment = sortedPayments[0];

    candidates.push({
      customerId,
      description: `${failedPayments.length} mock failed payment attempts detected for one demo customer.`,
      paymentId: latestPayment?.id,
      ruleId: rule.id,
      severity: rule.severity,
      title: "Repeated failed payments",
      triggeredAt: toDate(
        latestPayment?.failedAt ?? latestPayment?.createdAt ?? new Date(),
      ).toISOString(),
      type: rule.type,
    });
  }

  return candidates;
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

