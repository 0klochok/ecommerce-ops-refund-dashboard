"use client";

import { XIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  defaultRefundTableQuery,
  formatCurrency,
  formatRefundDate,
  getRefundTableRows,
  type RefundChannel,
  type RefundChannelFilter,
  type RefundOperation,
  type RefundPriority,
  type RefundRiskFilter,
  type RefundSortOption,
  type RefundStatus,
  type RefundStatusFilter,
  type RefundTableQuery,
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

const statusOptions: RefundStatus[] = [
  "pending_review",
  "approved",
  "processing",
  "resolved",
  "declined",
];

const channelOptions: RefundChannel[] = [
  "Online store",
  "Marketplace",
  "Support",
  "Stripe test",
];

const riskLabels: Record<RefundRiskFilter, string> = {
  all: "All",
  "urgent-high-risk": "Urgent / high risk",
};

const sortLabels: Record<RefundSortOption, string> = {
  "amount-asc": "Amount low to high",
  "amount-desc": "Amount high to low",
  "created-asc": "Oldest first",
  "created-desc": "Newest first",
};

type RefundOperationsTableProps = {
  refunds: RefundOperation[];
};

const controlClassName =
  "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const detailPanelId = "selected-refund-detail";

export function RefundOperationsTable({ refunds }: RefundOperationsTableProps) {
  const [query, setQuery] = useState<RefundTableQuery>(
    defaultRefundTableQuery,
  );
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);
  const selectedRefundButtonRef = useRef<HTMLButtonElement | null>(null);

  const visibleRefunds = useMemo(
    () => getRefundTableRows(refunds, query),
    [query, refunds],
  );

  const selectedRefund =
    selectedRefundId === null
      ? null
      : (visibleRefunds.find((refund) => refund.id === selectedRefundId) ??
        null);

  const hasActiveQuery =
    query.searchText.trim().length > 0 ||
    query.status !== "all" ||
    query.channel !== "all" ||
    query.risk !== "all" ||
    query.sort !== defaultRefundTableQuery.sort;

  function updateQuery(nextQuery: Partial<RefundTableQuery>) {
    const mergedQuery = {
      ...query,
      ...nextQuery,
    };

    if (
      selectedRefundId !== null &&
      !getRefundTableRows(refunds, mergedQuery).some(
        (refund) => refund.id === selectedRefundId,
      )
    ) {
      setSelectedRefundId(null);
    }

    setQuery(mergedQuery);
  }

  function resetQuery() {
    setSelectedRefundId(null);
    setQuery(defaultRefundTableQuery);
  }

  function closeSelectedRefund() {
    const returnFocusTarget = selectedRefundButtonRef.current;

    setSelectedRefundId(null);
    returnFocusTarget?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Refund table controls">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1.4fr)_repeat(2,minmax(9rem,1fr))] xl:grid-cols-[minmax(14rem,1.4fr)_repeat(4,minmax(9rem,1fr))_auto] xl:items-end">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-1">
              Search refunds
              <input
                aria-label="Search refunds by refund id, order id, or customer"
                className={controlClassName}
                onChange={(event) =>
                  updateQuery({ searchText: event.target.value })
                }
                placeholder="Order, customer, or refund id"
                type="search"
                value={query.searchText}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Status
              <select
                aria-label="Status filter"
                className={controlClassName}
                onChange={(event) =>
                  updateQuery({
                    status: event.target.value as RefundStatusFilter,
                  })
                }
                value={query.status}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Channel
              <select
                aria-label="Channel filter"
                className={controlClassName}
                onChange={(event) =>
                  updateQuery({
                    channel: event.target.value as RefundChannelFilter,
                  })
                }
                value={query.channel}
              >
                <option value="all">All channels</option>
                {channelOptions.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Risk
              <select
                aria-label="Risk filter"
                className={controlClassName}
                onChange={(event) =>
                  updateQuery({
                    risk: event.target.value as RefundRiskFilter,
                  })
                }
                value={query.risk}
              >
                {Object.entries(riskLabels).map(([riskValue, riskLabel]) => (
                  <option key={riskValue} value={riskValue}>
                    {riskLabel}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Sort
              <select
                aria-label="Sort refund table"
                className={controlClassName}
                onChange={(event) =>
                  updateQuery({
                    sort: event.target.value as RefundSortOption,
                  })
                }
                value={query.sort}
              >
                {Object.entries(sortLabels).map(([sortValue, sortLabel]) => (
                  <option key={sortValue} value={sortValue}>
                    {sortLabel}
                  </option>
                ))}
              </select>
            </label>

            <button
              aria-label="Reset refund filters and sorting"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-1 xl:w-auto"
              disabled={!hasActiveQuery}
              onClick={resetQuery}
              type="button"
            >
              Reset
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-500" aria-live="polite">
            Showing {visibleRefunds.length} of {refunds.length} refund records.
            Sorted by {sortLabels[query.sort].toLowerCase()}.
          </p>
        </div>
      </section>

      <div
        className={`grid gap-4 ${selectedRefund ? "xl:grid-cols-[minmax(0,1fr)_minmax(20rem,22rem)]" : ""}`}
      >
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[72rem] divide-y divide-slate-200 text-left text-sm">
              <caption className="sr-only">
                Refund operations queue with synthetic refund records, filters,
                sorting, and detail selection.
              </caption>
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
                {visibleRefunds.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center" colSpan={8}>
                      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                        <p className="text-sm font-medium text-slate-950">
                          No refunds match the current filters.
                        </p>
                        <p className="text-sm leading-6 text-slate-500">
                          Try a different order, customer, refund id, status, or
                          channel to bring records back into the queue.
                        </p>
                        <button
                          aria-label="Clear filters and sorting"
                          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          onClick={resetQuery}
                          type="button"
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleRefunds.map((refund) => {
                    const isSelected = selectedRefund?.id === refund.id;

                    return (
                      <tr
                        className={`align-top transition ${
                          isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                        }`}
                        key={refund.id}
                      >
                        <th className="whitespace-nowrap px-4 py-4" scope="row">
                          <button
                            aria-controls={
                              isSelected ? detailPanelId : undefined
                            }
                            aria-expanded={isSelected}
                            aria-label={`View details for refund ${refund.id}, order ${refund.orderId}, ${refund.customerLabel}`}
                            className="rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                            onClick={() => setSelectedRefundId(refund.id)}
                            ref={(button) => {
                              if (isSelected) {
                                selectedRefundButtonRef.current = button;
                              }
                            }}
                            type="button"
                          >
                            <span className="block font-medium text-slate-950 underline-offset-4 hover:underline">
                              {refund.id}
                            </span>
                            <span className="mt-1 block text-slate-500">
                              {refund.orderId}
                            </span>
                          </button>
                        </th>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRefund ? (
          <aside
            aria-label="Selected refund detail"
            className="relative rounded-md border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6 xl:self-start"
            id={detailPanelId}
          >
            <button
              aria-label="Close refund detail panel"
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
              onClick={closeSelectedRefund}
              type="button"
            >
              <XIcon aria-hidden="true" className="size-4" />
            </button>
            <div className="flex flex-col gap-5">
              <div className="pr-8">
                <p className="text-sm font-medium uppercase text-slate-500">
                  Selected refund
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  {selectedRefund.id}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedRefund.orderId} - {selectedRefund.customerLabel}
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <DetailItem
                  label="Amount"
                  value={formatCurrency(
                    selectedRefund.amountCents,
                    selectedRefund.currency,
                  )}
                />
                <DetailItem
                  label="Created"
                  value={formatRefundDate(selectedRefund.createdAt)}
                />
                <DetailItem label="Channel" value={selectedRefund.channel} />
                <DetailItem
                  label="Status"
                  value={statusLabels[selectedRefund.status]}
                />
                <DetailItem
                  label="Priority"
                  value={`${priorityLabels[selectedRefund.priority]} - ${selectedRefund.slaLabel}`}
                />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-950">Reason</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedRefund.reason}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-950">
                  Operations note
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedRefund.riskSummary}
                </p>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-950">{value}</p>
    </div>
  );
}
