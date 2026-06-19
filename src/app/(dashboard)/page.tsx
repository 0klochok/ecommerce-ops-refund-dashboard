import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueRefundChart } from "@/components/dashboard/revenue-refund-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatMoney, formatPercent } from "@/lib/domain/formatters";
import { getDashboardOverview } from "@/server/services/dashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const overview = await getDashboardOverview();
  const kpis = [
    {
      helper: "Paid, non-canceled order total",
      label: "Gross revenue",
      value: formatMoney(overview.kpis.grossRevenueCents),
    },
    {
      helper: "Paid, non-canceled orders",
      label: "Order count",
      value: overview.kpis.orderCount.toLocaleString("en-US"),
    },
    {
      helper: "Succeeded refund amount only",
      label: "Refund amount",
      value: formatMoney(overview.kpis.refundAmountCents),
    },
    {
      helper: "Refund amount divided by gross revenue",
      label: "Refund rate",
      value: formatPercent(overview.kpis.refundRate),
    },
    {
      helper: "Gross revenue divided by order count",
      label: "Average order value",
      value: formatMoney(overview.kpis.averageOrderValueCents),
    },
    {
      helper: "Physical orders not yet fulfilled",
      label: "Unfulfilled orders",
      value: overview.kpis.unfulfilledOrderCount.toLocaleString("en-US"),
    },
  ];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Demo operations overview
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Business-value operations overview
          </h1>
          <p className="text-muted-foreground">
            Revenue, refund, fulfillment, and payment risk signals from seeded
            demo data only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/orders">Review orders</Link>
          </Button>
          <Button asChild variant="outline">
            <a
              download
              href={`/api/reports/weekly-ops?weekStart=${overview.latestReportWeekStart}`}
            >
              Download weekly ops CSV
            </a>
          </Button>
        </div>
      </section>

      <section
        aria-label="Dashboard KPI summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {kpis.map((kpi) => (
          <KpiCard
            helper={kpi.helper}
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue and refunds over time</CardTitle>
            <CardDescription>
              Weekly gross revenue and succeeded refunds from demo orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueRefundChart data={overview.chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo data window</CardTitle>
            <CardDescription>
              The seeded dataset is deterministic and synthetic.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Orders loaded</p>
              <p className="mt-1 text-2xl font-semibold tracking-normal">
                {overview.totalOrderRecords.toLocaleString("en-US")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data through</p>
              <p className="mt-1 font-medium">
                {overview.dataThrough
                  ? formatDate(overview.dataThrough)
                  : "No orders"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Fulfillment exposure</p>
              <p className="mt-1 font-medium">
                {overview.kpis.delayedFulfillmentCount.toLocaleString("en-US")}{" "}
                delayed demo orders
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment risk</p>
              <p className="mt-1 font-medium">
                {overview.kpis.failedPaymentCount.toLocaleString("en-US")}{" "}
                failed demo payments
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
