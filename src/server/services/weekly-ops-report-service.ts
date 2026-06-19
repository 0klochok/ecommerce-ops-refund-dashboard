import { z } from "zod";
import {
  buildWeeklyOpsReportCsv,
  type WeeklyOpsCsvRow,
} from "@/lib/csv/weekly-ops-report";
import { readWeeklyOpsReportRecords } from "@/server/repositories/reports";

const DAY_MS = 24 * 60 * 60 * 1000;

export const weeklyOpsReportQuerySchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "weekStart must use YYYY-MM-DD format.")
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
      message: "weekStart must be a valid date.",
    }),
});

export async function getWeeklyOpsReportCsv(weekStartValue: string) {
  const parsed = weeklyOpsReportQuerySchema.parse({
    weekStart: weekStartValue,
  });
  const weekStart = new Date(`${parsed.weekStart}T00:00:00.000Z`);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
  const records = await readWeeklyOpsReportRecords({
    weekEnd,
    weekStart,
  });
  const rows: WeeklyOpsCsvRow[] = [
    ...records.orders.map((order) => ({
      amountCents: order.totalCents,
      currency: order.currency,
      customer: getCustomerName(order.customer),
      description: "Order placed during report week.",
      occurredAt: order.placedAt.toISOString(),
      orderNumber: order.orderNumber,
      recordId: order.id,
      section: "order" as const,
      status: order.status,
    })),
    ...records.refunds.map((refund) => ({
      amountCents: refund.amountCents,
      currency: refund.currency,
      customer: getCustomerName(refund.order.customer),
      description: refund.reason,
      occurredAt: refund.requestedAt.toISOString(),
      orderNumber: refund.order.orderNumber,
      recordId: refund.providerRefundId,
      section: "refund" as const,
      status: refund.status,
    })),
    ...records.disputes.map((dispute) => ({
      amountCents: dispute.amountCents,
      currency: dispute.currency,
      customer: getCustomerName(dispute.order.customer),
      description: dispute.reason,
      occurredAt: dispute.openedAt.toISOString(),
      orderNumber: dispute.order.orderNumber,
      recordId: dispute.providerDisputeId,
      section: "dispute" as const,
      status: dispute.status,
    })),
    ...records.fulfillmentDelays.map((order) => ({
      amountCents: "" as const,
      currency: "",
      customer: getCustomerName(order.customer),
      description: "Physical order is beyond the 72-hour demo fulfillment threshold.",
      occurredAt: order.placedAt.toISOString(),
      orderNumber: order.orderNumber,
      recordId: order.id,
      section: "fulfillment_delay" as const,
      status: order.status,
    })),
    ...records.alerts.map((alert) => ({
      amountCents: "" as const,
      currency: "",
      customer: alert.customer ? getCustomerName(alert.customer) : "",
      description: `${alert.title}: ${alert.description}`,
      occurredAt: alert.triggeredAt.toISOString(),
      orderNumber: alert.order?.orderNumber ?? "",
      recordId: alert.id,
      section: "alert" as const,
      status: `${alert.severity} ${alert.status}`,
    })),
  ];

  return buildWeeklyOpsReportCsv(rows);
}

function getCustomerName(customer: { firstName: string; lastName: string }) {
  return `${customer.firstName} ${customer.lastName}`;
}
