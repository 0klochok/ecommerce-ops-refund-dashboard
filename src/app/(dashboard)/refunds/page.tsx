import Link from "next/link";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  RefundStatusBadge,
  StatusBadge,
} from "@/components/orders/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/domain/formatters";
import { getRefundsPageData } from "@/server/services/refunds";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RefundsPage() {
  const data = await getRefundsPageData();

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Refunds and disputes
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Refund operations
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Mock provider refunds and disputes from seeded demo data only. No
          Stripe calls are made from this workflow.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          helper="Succeeded refund amount"
          label="Completed refunds"
          value={formatMoney(data.summary.completedRefundAmountCents)}
        />
        <KpiCard
          helper="All seeded refund records"
          label="Refund count"
          value={data.summary.refundCount.toLocaleString("en-US")}
        />
        <KpiCard
          helper="Active dispute exposure"
          label="Disputed amount"
          value={formatMoney(data.summary.disputedAmountCents)}
        />
        <KpiCard
          helper="Needs response or under review"
          label="Open disputes"
          value={data.summary.openDisputes.toLocaleString("en-US")}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Refunds</CardTitle>
          <CardDescription>
            Refund provider IDs, order context, customer links, status, and
            reason.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[68rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Refund</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Refund date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.refunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {refund.providerRefundId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {refund.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/orders/${refund.order.id}`}
                    >
                      {refund.order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Link
                        className="font-medium underline-offset-4 hover:underline"
                        href={`/customers/${refund.customer.id}`}
                      >
                        {refund.customer.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {refund.customer.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(refund.requestedAt)}</TableCell>
                  <TableCell>
                    {formatMoney(refund.amountCents, refund.currency)}
                  </TableCell>
                  <TableCell>
                    <RefundStatusBadge status={refund.status} />
                  </TableCell>
                  <TableCell className="max-w-sm">{refund.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disputes</CardTitle>
          <CardDescription>
            Mock dispute records with current operational status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[64rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Dispute</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {dispute.providerDisputeId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dispute.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/orders/${dispute.order.id}`}
                    >
                      {dispute.order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/customers/${dispute.customer.id}`}
                    >
                      {dispute.customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {formatMoney(dispute.amountCents, dispute.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={formatEnumLabel(dispute.status)}
                      tone={
                        dispute.status === "NEEDS_RESPONSE" ? "warning" : "info"
                      }
                    />
                  </TableCell>
                  <TableCell>{formatDate(dispute.openedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

