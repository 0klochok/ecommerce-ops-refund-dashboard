"use client";

import { ArrowUpDownIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/domain/formatters";
import {
  defaultOrderTableFilters,
  fulfillmentStatusLabels,
  fulfillmentStatusOptions,
  getFilteredOrderRows,
  orderStatusLabels,
  orderStatusOptions,
  paymentStatusLabels,
  paymentStatusOptions,
  sourceLabels,
  sourceOptions,
  type FulfillmentStatusValue,
  type OrderStatusValue,
  type OrderTableFilters,
  type OrderTableRow,
  type PaymentStatusValue,
  type StoreSourceValue,
} from "@/lib/domain/orders";
import {
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
  RefundStatusBadge,
} from "@/components/orders/status-badge";

type OrdersTableProps = {
  rows: OrderTableRow[];
};

export function OrdersTable({ rows }: OrdersTableProps) {
  const [filters, setFilters] = useState<OrderTableFilters>(
    defaultOrderTableFilters,
  );
  const [sorting, setSorting] = useState<SortingState>([
    {
      desc: true,
      id: "placedAt",
    },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const filteredRows = useMemo(
    () => getFilteredOrderRows(rows, filters),
    [filters, rows],
  );
  const columns = useMemo<ColumnDef<OrderTableRow>[]>(
    () => [
      {
        accessorKey: "orderNumber",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Link
              className="font-medium underline-offset-4 hover:underline"
              href={`/orders/${row.original.id}`}
            >
              {row.original.orderNumber}
            </Link>
            <span className="text-xs text-muted-foreground">
              {sourceLabels[row.original.source]}
            </span>
          </div>
        ),
        header: "Order",
      },
      {
        accessorKey: "customerName",
        cell: ({ row }) => (
          <div className="flex min-w-48 flex-col gap-1">
            {row.original.customerId ? (
              <Link
                className="font-medium underline-offset-4 hover:underline"
                href={`/customers/${row.original.customerId}`}
              >
                {row.original.customerName}
              </Link>
            ) : (
              <span className="font-medium">{row.original.customerName}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {row.original.customerEmail}
            </span>
          </div>
        ),
        header: "Customer",
      },
      {
        accessorKey: "placedAt",
        cell: ({ row }) => formatDate(row.original.placedAt),
        header: ({ column }) => (
          <SortHeader column={column} label="Order date" />
        ),
      },
      {
        accessorKey: "totalCents",
        cell: ({ row }) =>
          formatMoney(row.original.totalCents, row.original.currency),
        header: ({ column }) => <SortHeader column={column} label="Total" />,
      },
      {
        accessorKey: "status",
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
        header: "Order status",
      },
      {
        accessorKey: "fulfillmentStatus",
        cell: ({ row }) => (
          <FulfillmentStatusBadge status={row.original.fulfillmentStatus} />
        ),
        header: "Fulfillment",
      },
      {
        accessorKey: "paymentStatus",
        cell: ({ row }) => (
          <PaymentStatusBadge status={row.original.paymentStatus} />
        ),
        header: "Payment",
      },
      {
        accessorKey: "refundStatus",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <RefundStatusBadge status={row.original.refundStatus} />
            {row.original.refundAmountCents > 0 ? (
              <span className="text-xs text-muted-foreground">
                {formatMoney(
                  row.original.refundAmountCents,
                  row.original.currency,
                )}
              </span>
            ) : null}
          </div>
        ),
        header: "Refund",
      },
      {
        accessorKey: "source",
        cell: ({ row }) => sourceLabels[row.original.source],
        header: "Source",
      },
      {
        cell: ({ row }) => (
          <Button asChild size="sm" variant="outline">
            <Link href={`/orders/${row.original.id}`}>View</Link>
          </Button>
        ),
        id: "actions",
        header: "Actions",
      },
    ],
    [],
  );
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table owns table state through this hook.
  const table = useReactTable({
    columns,
    data: filteredRows,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  });

  function updateFilters(nextFilters: Partial<OrderTableFilters>) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
    setPagination((currentPagination) => ({
      ...currentPagination,
      pageIndex: 0,
    }));
  }

  function resetFilters() {
    setFilters(defaultOrderTableFilters);
    setPagination((currentPagination) => ({
      ...currentPagination,
      pageIndex: 0,
    }));
  }

  const hasActiveFilters =
    filters.searchText.trim().length > 0 ||
    filters.orderStatus !== "all" ||
    filters.fulfillmentStatus !== "all" ||
    filters.paymentStatus !== "all" ||
    filters.source !== "all";

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Order table controls"
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1.4fr)_repeat(4,minmax(10rem,1fr))_auto] xl:items-end"
      >
        <label className="flex min-w-0 flex-col gap-1 text-sm font-medium md:col-span-2 xl:col-span-1">
          Search orders
          <Input
            aria-label="Search orders by order number, customer, or email"
            onChange={(event) =>
              updateFilters({
                searchText: event.target.value,
              })
            }
            placeholder="Order, customer, or email"
            type="search"
            value={filters.searchText}
          />
        </label>

        <FilterSelect
          label="Order status"
          onValueChange={(value) =>
            updateFilters({
              orderStatus: value as OrderStatusValue | "all",
            })
          }
          options={orderStatusOptions.map((status) => ({
            label: orderStatusLabels[status],
            value: status,
          }))}
          value={filters.orderStatus}
        />
        <FilterSelect
          label="Fulfillment"
          onValueChange={(value) =>
            updateFilters({
              fulfillmentStatus: value as FulfillmentStatusValue | "all",
            })
          }
          options={fulfillmentStatusOptions.map((status) => ({
            label: fulfillmentStatusLabels[status],
            value: status,
          }))}
          value={filters.fulfillmentStatus}
        />
        <FilterSelect
          label="Payment"
          onValueChange={(value) =>
            updateFilters({
              paymentStatus: value as PaymentStatusValue | "all",
            })
          }
          options={paymentStatusOptions.map((status) => ({
            label: paymentStatusLabels[status],
            value: status,
          }))}
          value={filters.paymentStatus}
        />
        <FilterSelect
          label="Source"
          onValueChange={(value) =>
            updateFilters({
              source: value as StoreSourceValue | "all",
            })
          }
          options={sourceOptions.map((source) => ({
            label: sourceLabels[source],
            value: source,
          }))}
          value={filters.source}
        />
        <Button
          disabled={!hasActiveFilters}
          onClick={resetFilters}
          type="button"
          variant="outline"
        >
          Reset
        </Button>
      </section>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {table.getRowModel().rows.length} of {filteredRows.length}{" "}
        matching orders, {rows.length} total.
      </p>

      <Table className="min-w-[74rem]">
        <TableCaption>
          Orders with customer, fulfillment, payment, refund, and source
          context.
        </TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-32 text-center" colSpan={columns.length}>
                No orders match the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(table.getPageCount(), 1)}
        </p>
        <div className="flex gap-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            type="button"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  column,
  label,
}: {
  column: Column<OrderTableRow, unknown>;
  label: string;
}) {
  return (
    <Button
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      size="sm"
      type="button"
      variant="ghost"
    >
      {label}
      <ArrowUpDownIcon aria-hidden="true" data-icon="inline-end" />
    </Button>
  );
}

function FilterSelect({
  label,
  onValueChange,
  options,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-medium">
      {label}
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger aria-label={`${label} filter`} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  );
}
