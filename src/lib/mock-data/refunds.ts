export type RefundStatus =
  | "pending_review"
  | "approved"
  | "processing"
  | "resolved"
  | "declined";

export type RefundPriority = "urgent" | "high" | "standard" | "watch";

export type RefundChannel =
  | "Online store"
  | "Marketplace"
  | "Support"
  | "Stripe test";

export type RefundOperation = {
  id: string;
  orderId: string;
  customerLabel: string;
  amountCents: number;
  currency: "USD";
  status: RefundStatus;
  reason: string;
  channel: RefundChannel;
  createdAt: string;
  priority: RefundPriority;
  slaLabel: string;
  riskSummary: string;
};

export type RefundMetrics = {
  totalRefunds: number;
  totalRefundAmountCents: number;
  openRefunds: number;
  urgentRefunds: number;
  averageRefundAmountCents: number;
};

export type RefundStatusFilter = RefundStatus | "all";
export type RefundChannelFilter = RefundChannel | "all";
export type RefundRiskFilter = "all" | "urgent-high-risk";
export type RefundSortOption =
  | "created-desc"
  | "created-asc"
  | "amount-desc"
  | "amount-asc";

export type RefundTableQuery = {
  searchText: string;
  status: RefundStatusFilter;
  channel: RefundChannelFilter;
  risk: RefundRiskFilter;
  sort: RefundSortOption;
};

const openRefundStatuses = new Set<RefundStatus>([
  "pending_review",
  "approved",
  "processing",
]);

const urgentRefundPriorities = new Set<RefundPriority>(["urgent", "high"]);

export const defaultRefundTableQuery: RefundTableQuery = {
  channel: "all",
  risk: "all",
  searchText: "",
  sort: "created-desc",
  status: "all",
};

export const refundOperations: RefundOperation[] = [
  {
    id: "rfnd_demo_1001",
    orderId: "ORD-1048",
    customerLabel: "Returning customer A",
    amountCents: 14890,
    currency: "USD",
    status: "pending_review",
    reason: "Carrier delay after promised delivery window",
    channel: "Online store",
    createdAt: "2026-06-17",
    priority: "urgent",
    slaLabel: "Due today",
    riskSummary: "High-value order with late fulfillment",
  },
  {
    id: "rfnd_demo_1002",
    orderId: "ORD-1042",
    customerLabel: "Guest checkout B",
    amountCents: 6499,
    currency: "USD",
    status: "processing",
    reason: "Wrong size returned unopened",
    channel: "Marketplace",
    createdAt: "2026-06-16",
    priority: "standard",
    slaLabel: "2 days left",
    riskSummary: "Return label scanned",
  },
  {
    id: "rfnd_demo_1003",
    orderId: "ORD-1039",
    customerLabel: "Wholesale buyer C",
    amountCents: 30250,
    currency: "USD",
    status: "approved",
    reason: "Partial refund for damaged bundle item",
    channel: "Support",
    createdAt: "2026-06-15",
    priority: "high",
    slaLabel: "Due tomorrow",
    riskSummary: "Large partial refund needs finance review",
  },
  {
    id: "rfnd_demo_1004",
    orderId: "ORD-1037",
    customerLabel: "Loyalty member D",
    amountCents: 3899,
    currency: "USD",
    status: "resolved",
    reason: "Duplicate shipping charge corrected",
    channel: "Stripe test",
    createdAt: "2026-06-14",
    priority: "watch",
    slaLabel: "Closed",
    riskSummary: "Resolved before SLA breach",
  },
  {
    id: "rfnd_demo_1005",
    orderId: "ORD-1031",
    customerLabel: "Subscription shopper E",
    amountCents: 8990,
    currency: "USD",
    status: "pending_review",
    reason: "Repeated failed payment followed by cancellation",
    channel: "Stripe test",
    createdAt: "2026-06-13",
    priority: "high",
    slaLabel: "Overdue",
    riskSummary: "Repeat payment failure pattern",
  },
  {
    id: "rfnd_demo_1006",
    orderId: "ORD-1028",
    customerLabel: "First-time customer F",
    amountCents: 2199,
    currency: "USD",
    status: "declined",
    reason: "Return window expired with no exception",
    channel: "Online store",
    createdAt: "2026-06-12",
    priority: "standard",
    slaLabel: "Closed",
    riskSummary: "Policy decision documented",
  },
  {
    id: "rfnd_demo_1007",
    orderId: "ORD-1022",
    customerLabel: "Gift order G",
    amountCents: 11200,
    currency: "USD",
    status: "resolved",
    reason: "Refund issued for missing accessory",
    channel: "Support",
    createdAt: "2026-06-10",
    priority: "watch",
    slaLabel: "Closed",
    riskSummary: "Replacement shipment completed",
  },
];

export function calculateRefundMetrics(
  refunds: RefundOperation[],
): RefundMetrics {
  const totalRefundAmountCents = refunds.reduce(
    (sum, refund) => sum + refund.amountCents,
    0,
  );

  return {
    totalRefunds: refunds.length,
    totalRefundAmountCents,
    openRefunds: refunds.filter((refund) =>
      openRefundStatuses.has(refund.status),
    ).length,
    urgentRefunds: refunds.filter(isUrgentOrHighRiskRefund).length,
    averageRefundAmountCents:
      refunds.length === 0
        ? 0
        : Math.round(totalRefundAmountCents / refunds.length),
  };
}

export function isUrgentOrHighRiskRefund(refund: RefundOperation) {
  return urgentRefundPriorities.has(refund.priority);
}

export function getRefundTableRows(
  refunds: RefundOperation[],
  query: RefundTableQuery,
) {
  const searchText = query.searchText.trim().toLowerCase();

  return refunds
    .filter((refund) => {
      const matchesSearch =
        searchText.length === 0 ||
        refund.id.toLowerCase().includes(searchText) ||
        refund.orderId.toLowerCase().includes(searchText) ||
        refund.customerLabel.toLowerCase().includes(searchText);
      const matchesStatus =
        query.status === "all" || refund.status === query.status;
      const matchesChannel =
        query.channel === "all" || refund.channel === query.channel;
      const matchesRisk =
        query.risk === "all" || isUrgentOrHighRiskRefund(refund);

      return matchesSearch && matchesStatus && matchesChannel && matchesRisk;
    })
    .sort((firstRefund, secondRefund) => {
      if (query.sort === "amount-desc" || query.sort === "amount-asc") {
        const amountDifference =
          firstRefund.amountCents - secondRefund.amountCents;

        return query.sort === "amount-desc"
          ? -amountDifference
          : amountDifference;
      }

      const dateDifference =
        new Date(`${firstRefund.createdAt}T00:00:00.000Z`).getTime() -
        new Date(`${secondRefund.createdAt}T00:00:00.000Z`).getTime();

      return query.sort === "created-desc" ? -dateDifference : dateDifference;
    });
}

export function formatCurrency(amountCents: number, currency: "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amountCents / 100);
}

export function formatRefundDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00.000Z`));
}
