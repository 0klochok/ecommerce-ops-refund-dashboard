import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addCustomerNoteAction } from "@/app/(dashboard)/customers/[customerId]/actions";
import { PaymentStatusBadge, StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
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
import { getCustomerDetail } from "@/server/services/customers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
  searchParams?: Promise<{
    noteStatus?: string;
  }>;
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const { customerId } = await params;
  const status = (await searchParams)?.noteStatus;
  const customer = await getCustomerDetail(customerId);

  if (!customer) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      <div>
        <Button asChild variant="ghost">
          <Link href="/orders">
            <ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
            Back to orders
          </Link>
        </Button>
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Customer detail
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          {customer.name}
        </h1>
        <p className="text-muted-foreground">{customer.email}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          helper="Paid demo order total"
          label="Lifetime revenue"
          value={formatMoney(customer.lifetimeRevenueCents)}
        />
        <MetricCard
          helper="Stored customer LTV"
          label="Lifetime value"
          value={formatMoney(customer.lifetimeValueCents)}
        />
        <MetricCard
          helper="Succeeded refund amount"
          label="Refunded"
          value={formatMoney(customer.totalRefundedCents)}
        />
        <MetricCard
          helper="All customer refund records"
          label="Refund count"
          value={customer.refundCount.toLocaleString("en-US")}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <Card>
          <CardHeader>
            <CardTitle>Customer profile</CardTitle>
            <CardDescription>
              Synthetic profile details for operations review.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <DetailRow label="Email" value={customer.email} />
            <DetailRow
              label="Phone"
              value={customer.phone ?? "Not provided"}
            />
            <DetailRow
              label="Location"
              value={[customer.city, customer.state, customer.country]
                .filter(Boolean)
                .join(", ")}
            />
            <DetailRow label="Created" value={formatDate(customer.createdAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add note</CardTitle>
            <CardDescription>
              Demo-safe note form stored only in the local database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={addCustomerNoteAction} className="flex flex-col gap-3">
              <input name="customerId" type="hidden" value={customer.id} />
              <label className="flex flex-col gap-2 text-sm font-medium">
                Note
                <textarea
                  className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  maxLength={500}
                  name="body"
                  placeholder="Add a synthetic operations note"
                  required
                />
              </label>
              <Button type="submit">Add note</Button>
              {status === "added" ? (
                <p className="text-sm text-muted-foreground">
                  Note added to the demo customer profile.
                </p>
              ) : null}
              {status === "invalid" ? (
                <p className="text-sm font-medium text-destructive">
                  Enter a note between 1 and 500 characters.
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Customer orders</CardTitle>
          <CardDescription>Orders linked to this demo customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Refunded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/orders/${order.id}`}
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(order.placedAt)}</TableCell>
                  <TableCell>{formatEnumLabel(order.status)}</TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    {formatMoney(order.totalCents, order.currency)}
                  </TableCell>
                  <TableCell>
                    {formatMoney(order.refundAmountCents, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Refunds and disputes</CardTitle>
            <CardDescription>
              Provider records associated with this customer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <RecordList
              emptyLabel="No refund records for this customer."
              items={customer.refunds.map((refund) => ({
                amount: formatMoney(refund.amountCents, refund.currency),
                href: `/orders/${refund.orderId}`,
                label: refund.providerRefundId,
                meta: `${refund.orderNumber} - ${formatEnumLabel(refund.status)}`,
              }))}
              title="Refunds"
            />
            <RecordList
              emptyLabel="No dispute records for this customer."
              items={customer.disputes.map((dispute) => ({
                amount: formatMoney(dispute.amountCents, dispute.currency),
                href: `/orders/${dispute.orderId}`,
                label: dispute.providerDisputeId,
                meta: `${dispute.orderNumber} - ${formatEnumLabel(dispute.status)}`,
              }))}
              title="Disputes"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>
              Existing customer notes from seeded and local demo data.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {customer.notes.length > 0 ? (
              customer.notes.map((note) => (
                <div className="rounded-lg border p-3" key={note.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={note.authorLabel} tone="neutral" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{note.body}</p>
                  {note.order ? (
                    <Link
                      className="mt-2 inline-block text-sm underline-offset-4 hover:underline"
                      href={`/orders/${note.order.id}`}
                    >
                      {note.order.orderNumber}
                    </Link>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No notes are attached to this demo customer.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function MetricCard({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "Not provided"}</span>
    </div>
  );
}

function RecordList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: { amount: string; href: string; label: string; meta: string }[];
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {items.length > 0 ? (
        items.map((item) => (
          <Link
            className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm underline-offset-4 hover:underline"
            href={item.href}
            key={item.label}
          >
            <span>
              <span className="block font-medium">{item.label}</span>
              <span className="mt-1 block text-muted-foreground">
                {item.meta}
              </span>
            </span>
            <span className="font-medium">{item.amount}</span>
          </Link>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

