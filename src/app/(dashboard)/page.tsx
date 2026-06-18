import {
  calculateRefundMetrics,
  formatCurrency,
  formatRefundDate,
  refundOperations,
  type RefundPriority,
  type RefundStatus,
} from "@/lib/mock-data/refunds";

const statusLabels: Record<RefundStatus, string> = {
  approved: "Approved",
  declined: "Declined",
  pending_review: "Pending review",
  processing: "Processing",
  resolved: "Resolved",
};

const statusStyles: Record<RefundStatus, string> = {
  approved: "border-sky-200 bg-sky-50 text-sky-800",
  declined: "border-slate-200 bg-slate-100 text-slate-700",
  pending_review: "border-amber-200 bg-amber-50 text-amber-800",
  processing: "border-indigo-200 bg-indigo-50 text-indigo-800",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const priorityLabels: Record<RefundPriority, string> = {
  high: "High risk",
  standard: "Standard",
  urgent: "Urgent",
  watch: "Watch",
};

const priorityStyles: Record<RefundPriority, string> = {
  high: "border-orange-200 bg-orange-50 text-orange-800",
  standard: "border-slate-200 bg-white text-slate-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-800",
  watch: "border-blue-200 bg-blue-50 text-blue-800",
};

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
              Phase 1 static UI
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
                Refund operations queue
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Synthetic refund records shaped for operations review,
                escalation, and screenshot-ready portfolio demos.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">
              {metrics.openRefunds} open of {metrics.totalRefunds} total
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-100 text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3" scope="col">
                      Refund / order
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Customer
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Amount
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Status
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Reason
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Channel
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Created
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Priority / SLA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {refunds.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-sm text-slate-500"
                        colSpan={8}
                      >
                        No refund operations are in the demo queue.
                      </td>
                    </tr>
                  ) : (
                    refunds.map((refund) => (
                      <tr className="align-top" key={refund.id}>
                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="font-medium text-slate-950">
                            {refund.id}
                          </div>
                          <div className="mt-1 text-slate-500">
                            {refund.orderId}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {refund.customerLabel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">
                          {formatCurrency(
                            refund.amountCents,
                            refund.currency,
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${statusStyles[refund.status]}`}
                          >
                            {statusLabels[refund.status]}
                          </span>
                        </td>
                        <td className="min-w-64 px-4 py-4 text-slate-700">
                          <div>{refund.reason}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {refund.riskSummary}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {refund.channel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {formatRefundDate(refund.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${priorityStyles[refund.priority]}`}
                          >
                            {priorityLabels[refund.priority]}
                          </span>
                          <div className="mt-2 text-xs text-slate-500">
                            {refund.slaLabel}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
