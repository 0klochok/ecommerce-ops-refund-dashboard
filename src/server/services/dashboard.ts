import {
  getWeeklyRevenueRefundChartData,
  getUtcWeekStartIso,
  type RevenueRefundChartPoint,
} from "@/lib/domain/dashboard";
import {
  calculateDashboardKpis,
  type DashboardKpis,
  type KpiDispute,
  type KpiOrder,
  type KpiPayment,
  type KpiRefund,
} from "@/lib/domain/kpis";
import {
  getPrimaryPaymentStatus,
  type FulfillmentStatusValue,
  type OrderStatusValue,
  type PaymentStatusValue,
  type RefundStatusValue,
} from "@/lib/domain/orders";
import { readDashboardRecords } from "@/server/repositories/dashboard";

const DEMO_REFERENCE_DATE = "2026-06-15T12:00:00.000Z";

export type DashboardOverview = {
  chartData: RevenueRefundChartPoint[];
  dataThrough: string | null;
  generatedAt: string;
  kpis: DashboardKpis;
  latestReportWeekStart: string;
  totalOrderRecords: number;
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const records = await readDashboardRecords();
  const orders = records.orders.map((order): KpiOrder => {
    const orderStatus = order.status as OrderStatusValue;

    return {
      fulfillmentStatus: order.fulfillmentStatus as FulfillmentStatusValue,
      hasPhysicalItems: order.hasPhysicalItems,
      paymentStatus: getPrimaryPaymentStatus(
        order.payments.map(
          (payment) => payment.status as PaymentStatusValue,
        ),
        orderStatus,
      ),
      placedAt: order.placedAt,
      status: orderStatus,
      totalCents: order.totalCents,
    };
  });
  const refunds = records.refunds.map(
    (refund): KpiRefund & {
      processedAt: Date | null;
      requestedAt: Date;
    } => ({
      amountCents: refund.amountCents,
      processedAt: refund.processedAt,
      requestedAt: refund.requestedAt,
      status: refund.status as RefundStatusValue,
    }),
  );
  const payments = records.payments.map(
    (payment): KpiPayment => ({
      status: payment.status as PaymentStatusValue,
    }),
  );
  const disputes = records.disputes.map(
    (dispute): KpiDispute => ({
      amountCents: dispute.amountCents,
      status: dispute.status,
    }),
  );

  const latestOrderDate = getLatestOrderDate(records.orders);

  return {
    chartData: getWeeklyRevenueRefundChartData({
      orders,
      refunds,
    }),
    dataThrough: latestOrderDate,
    generatedAt: new Date().toISOString(),
    kpis: calculateDashboardKpis({
      disputes,
      orders,
      payments,
      referenceDate: DEMO_REFERENCE_DATE,
      refunds,
    }),
    latestReportWeekStart: latestOrderDate
      ? getUtcWeekStartIso(latestOrderDate)
      : getUtcWeekStartIso(DEMO_REFERENCE_DATE),
    totalOrderRecords: records.orders.length,
  };
}

function getLatestOrderDate(orders: readonly { placedAt: Date }[]) {
  if (orders.length === 0) {
    return null;
  }

  return new Date(
    Math.max(...orders.map((order) => order.placedAt.getTime())),
  ).toISOString();
}
