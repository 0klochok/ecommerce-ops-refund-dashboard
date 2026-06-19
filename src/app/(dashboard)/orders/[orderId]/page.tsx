import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
  RefundStatusBadge,
} from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/domain/formatters";
import {
  fulfillmentStatusLabels,
  paymentStatusLabels,
  refundStatusLabels,
} from "@/lib/domain/orders";
import { getOrderDetail } from "@/server/services/orders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { orderId } = await params;
  const order = await getOrderDetail(orderId);

  if (!order) {
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

      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Order detail
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            {order.orderNumber}
          </h1>
          <p className="text-muted-foreground">
            {order.customer.name} - {formatDate(order.placedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <FulfillmentStatusBadge status={order.fulfillmentStatus} />
          <PaymentStatusBadge status={order.paymentStatus} />
          <RefundStatusBadge status={order.refundStatus} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle aria-level={2} role="heading">
              Order summary
            </CardTitle>
            <CardDescription>{order.sourceOrderId}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow label="Placed" value={formatDate(order.placedAt)} />
            <DetailRow label="Source" value={formatSource(order.source)} />
            <DetailRow
              label="Subtotal"
              value={formatMoney(order.subtotalCents, order.currency)}
            />
            <DetailRow
              label="Discount"
              value={formatMoney(order.discountCents, order.currency)}
            />
            <DetailRow
              label="Shipping"
              value={formatMoney(order.shippingCents, order.currency)}
            />
            <DetailRow
              label="Tax"
              value={formatMoney(order.taxCents, order.currency)}
            />
            <Separator />
            <DetailRow
              label="Total"
              value={formatMoney(order.totalCents, order.currency)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle aria-level={2} role="heading">
              Customer summary
            </CardTitle>
            <CardDescription>{order.customer.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow label="Name" value={order.customer.name} />
            <DetailRow
              label="Location"
              value={formatLocation(order.customer)}
            />
            <DetailRow
              label="Phone"
              value={order.customer.phone ?? "Not provided"}
            />
            <DetailRow
              label="Lifetime value"
              value={formatMoney(
                order.customer.lifetimeValueCents,
                order.currency,
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle aria-level={2} role="heading">
              Payment and refund
            </CardTitle>
            <CardDescription>
              {paymentStatusLabels[order.paymentStatus]} payment status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <DetailRow
              label="Refund status"
              value={refundStatusLabels[order.refundStatus]}
            />
            <DetailRow
              label="Refund amount"
              value={formatMoney(order.refundAmountCents, order.currency)}
            />
            <DetailRow
              label="Payment records"
              value={order.payments.length.toLocaleString("en-US")}
            />
            <DetailRow
              label="Disputes"
              value={order.disputes.length.toLocaleString("en-US")}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle aria-level={2} role="heading">
            Line items
          </CardTitle>
          <CardDescription>
            Physical and digital item mix for this demo order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Fulfilled</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{formatEnumLabel(item.productType)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {item.fulfilledQuantity} of {item.fulfillableQuantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.totalAmountCents, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle aria-level={2} role="heading">
              Fulfillment events
            </CardTitle>
            <CardDescription>
              {fulfillmentStatusLabels[order.fulfillmentStatus]} current
              fulfillment state.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.fulfillmentEvents.length > 0 ? (
              order.fulfillmentEvents.map((event) => (
                <div className="rounded-lg border p-3" key={event.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <FulfillmentStatusBadge status={event.status} />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(event.occurredAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">
                    {event.notes ?? "No fulfillment note"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[event.carrier, event.trackingNumber]
                      .filter(Boolean)
                      .join(" - ") || "No tracking"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No fulfillment events are attached to this demo order.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle aria-level={2} role="heading">
              Payment, refund, and dispute records
            </CardTitle>
            <CardDescription>
              Mock provider records associated with this order.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <RecordList
              emptyLabel="No payment records."
              items={order.payments.map((payment) => ({
                id: payment.id,
                label: payment.providerPaymentId,
                meta: paymentStatusLabels[payment.status],
                value: formatMoney(payment.amountCents, payment.currency),
              }))}
              title="Payments"
            />
            <RecordList
              emptyLabel="No refund records."
              items={order.refunds.map((refund) => ({
                id: refund.id,
                label: refund.providerRefundId,
                meta: refundStatusLabels[refund.status],
                value: formatMoney(refund.amountCents, refund.currency),
              }))}
              title="Refunds"
            />
            <RecordList
              emptyLabel="No dispute records."
              items={order.disputes.map((dispute) => ({
                id: dispute.id,
                label: dispute.providerDisputeId,
                meta: formatEnumLabel(dispute.status),
                value: formatMoney(dispute.amountCents, dispute.currency),
              }))}
              title="Disputes"
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function RecordList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: { id: string; label: string; meta: string; value: string }[];
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {items.length > 0 ? (
        items.map((item) => (
          <div
            className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm"
            key={item.id}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{item.label}</p>
              <p className="mt-1 text-muted-foreground">{item.meta}</p>
            </div>
            <p className="font-medium">{item.value}</p>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function formatLocation(customer: {
  city: string | null;
  country: string;
  state: string | null;
}) {
  return [customer.city, customer.state, customer.country]
    .filter(Boolean)
    .join(", ");
}

function formatSource(value: string) {
  return formatEnumLabel(value);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
