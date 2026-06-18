import {
  calculateRefundMetrics,
  formatCurrency,
  refundOperations,
} from "@/lib/mock-data/refunds";
import { RefundOperationsTable } from "./refund-operations-table";

export default function Home() {
  const refunds = refundOperations;
  const metrics = calculateRefundMetrics(refunds);
  const currency = refunds[0]?.currency ?? "USD";

  const kpis = [
    {
      label: "Total refunded",
      value: formatCurrency(metrics.totalRefundAmountCents, currency),
      helper: `${metrics.totalRefunds} demo refund records`,
    },
    {
      label: "Open refunds",
      value: metrics.openRefunds.toString(),
      helper: "Pending, approved, or processing",
    },
    {
      label: "Urgent / high risk",
      value: metrics.urgentRefunds.toString(),
      helper: "Needs same-day operations review",
    },
    {
      label: "Average refund",
      value: formatCurrency(metrics.averageRefundAmountCents, currency),
      helper: "Across the static Phase 1 sample",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950 sm:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase text-slate-500">
              Phase 2 client-side interactions
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Refund operations dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Portfolio dashboard shell for a small ecommerce operations team,
              using typed mock refund data only. No customer, payment, store, or
              webhook data is connected in this phase.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span className="font-medium text-slate-950">Demo mode:</span>{" "}
            static mock data
          </div>
        </header>

        <section
          aria-label="Refund KPI summary"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {kpis.map((kpi) => (
            <article
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              key={kpi.label}
            >
              <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {kpi.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {kpi.helper}
              </p>
            </article>
          ))}
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="refund-table">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                className="text-xl font-semibold text-slate-950"
                id="refund-table"
              >
                Interactive refund operations queue
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Synthetic refund records shaped for operations review,
                escalation, search, filtering, sorting, and screenshot-ready
                portfolio demos.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">
              {metrics.openRefunds} open of {metrics.totalRefunds} total
            </p>
          </div>

          <RefundOperationsTable refunds={refunds} />
        </section>
      </div>
    </main>
  );
}
