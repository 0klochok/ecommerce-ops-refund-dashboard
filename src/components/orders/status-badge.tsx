import { Badge } from "@/components/ui/badge";
import {
  fulfillmentStatusLabels,
  getFulfillmentStatusTone,
  getOrderStatusTone,
  getPaymentStatusTone,
  getRefundStatusTone,
  orderStatusLabels,
  paymentStatusLabels,
  refundStatusLabels,
  type FulfillmentStatusValue,
  type OrderStatusValue,
  type PaymentStatusValue,
  type RefundSummaryStatus,
  type StatusTone,
} from "@/lib/domain/orders";

type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
};

const badgeVariantByTone: Record<
  StatusTone,
  "default" | "destructive" | "outline" | "secondary"
> = {
  danger: "destructive",
  info: "outline",
  neutral: "outline",
  success: "default",
  warning: "secondary",
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <Badge className="font-medium" variant={badgeVariantByTone[tone]}>
      {label}
    </Badge>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatusValue }) {
  return (
    <StatusBadge
      label={orderStatusLabels[status]}
      tone={getOrderStatusTone(status)}
    />
  );
}

export function FulfillmentStatusBadge({
  status,
}: {
  status: FulfillmentStatusValue;
}) {
  return (
    <StatusBadge
      label={fulfillmentStatusLabels[status]}
      tone={getFulfillmentStatusTone(status)}
    />
  );
}

export function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatusValue;
}) {
  return (
    <StatusBadge
      label={paymentStatusLabels[status]}
      tone={getPaymentStatusTone(status)}
    />
  );
}

export function RefundStatusBadge({
  status,
}: {
  status: RefundSummaryStatus;
}) {
  return (
    <StatusBadge
      label={refundStatusLabels[status]}
      tone={getRefundStatusTone(status)}
    />
  );
}
