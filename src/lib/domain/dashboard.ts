import {
  isCompletedRefund,
  isCountedPaidOrder,
  type KpiOrder,
  type KpiRefund,
} from "@/lib/domain/kpis";
import { formatShortDate, toDate } from "@/lib/domain/formatters";

export type DashboardChartOrder = Pick<
  KpiOrder,
  | "fulfillmentStatus"
  | "hasPhysicalItems"
  | "paymentStatus"
  | "placedAt"
  | "status"
  | "totalCents"
>;

export type DashboardChartRefund = KpiRefund & {
  processedAt: Date | string | null;
  requestedAt: Date | string;
};

export type RevenueRefundChartPoint = {
  refundCents: number;
  revenueCents: number;
  weekLabel: string;
  weekStart: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getWeeklyRevenueRefundChartData({
  orders,
  refunds,
}: {
  orders: readonly DashboardChartOrder[];
  refunds: readonly DashboardChartRefund[];
}) {
  const buckets = new Map<string, RevenueRefundChartPoint>();

  for (const order of orders) {
    if (!isCountedPaidOrder(order)) {
      continue;
    }

    const bucket = getOrCreateBucket(buckets, order.placedAt);
    bucket.revenueCents += order.totalCents;
  }

  for (const refund of refunds) {
    if (!isCompletedRefund(refund)) {
      continue;
    }

    const bucket = getOrCreateBucket(
      buckets,
      refund.processedAt ?? refund.requestedAt,
    );
    bucket.refundCents += refund.amountCents;
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart),
  );
}

function getOrCreateBucket(
  buckets: Map<string, RevenueRefundChartPoint>,
  value: Date | string,
) {
  const weekStart = getUtcWeekStartIso(value);
  const existingBucket = buckets.get(weekStart);

  if (existingBucket) {
    return existingBucket;
  }

  const bucket = {
    refundCents: 0,
    revenueCents: 0,
    weekLabel: formatShortDate(weekStart),
    weekStart,
  };

  buckets.set(weekStart, bucket);
  return bucket;
}

function getUtcWeekStartIso(value: Date | string) {
  const date = toDate(value);
  const midnightUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const day = new Date(midnightUtc).getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  return new Date(midnightUtc - daysSinceMonday * DAY_MS)
    .toISOString()
    .slice(0, 10);
}
