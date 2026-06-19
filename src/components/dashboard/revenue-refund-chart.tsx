"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/domain/formatters";
import type { RevenueRefundChartPoint } from "@/lib/domain/dashboard";

type RevenueRefundChartProps = {
  data: RevenueRefundChartPoint[];
};

export function RevenueRefundChart({ data }: RevenueRefundChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex min-h-72 items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground"
        data-testid="revenue-refund-chart"
      >
        No revenue or refund activity in the demo dataset.
      </div>
    );
  }

  return (
    <div className="h-72 w-full min-w-0" data-testid="revenue-refund-chart">
      <ResponsiveContainer height={288} minWidth={0} width="100%">
        <AreaChart
          data={data}
          margin={{
            bottom: 8,
            left: 0,
            right: 16,
            top: 12,
          }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="weekLabel"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatMoney(Number(value))}
            tickLine={false}
            tickMargin={10}
            width={84}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            formatter={(value, name) => [
              formatMoney(Number(value)),
              name === "revenueCents" ? "Revenue" : "Refunds",
            ]}
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Area
            dataKey="revenueCents"
            fill="var(--chart-2)"
            fillOpacity={0.18}
            name="Revenue"
            stroke="var(--chart-2)"
            strokeWidth={2}
            type="monotone"
          />
          <Area
            dataKey="refundCents"
            fill="var(--chart-4)"
            fillOpacity={0.12}
            name="Refunds"
            stroke="var(--chart-4)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
