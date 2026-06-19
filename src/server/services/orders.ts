import {
  getPrimaryPaymentStatus,
  getRefundSummary,
  type FulfillmentStatusValue,
  type OrderStatusValue,
  type OrderTableRow,
  type PaymentStatusValue,
  type RefundStatusValue,
  type StoreSourceValue,
} from "@/lib/domain/orders";
import {
  readOrderDetailRecord,
  readOrderTableRecords,
} from "@/server/repositories/orders";

export type OrderDetailDto = {
  canceledAt: string | null;
  createdAt: string;
  currency: string;
  customer: {
    city: string | null;
    country: string;
    email: string;
    lifetimeValueCents: number;
    name: string;
    phone: string | null;
    state: string | null;
  };
  discountCents: number;
  disputes: {
    amountCents: number;
    currency: string;
    id: string;
    openedAt: string;
    provider: string;
    providerDisputeId: string;
    reason: string;
    status: string;
  }[];
  fulfillmentEvents: {
    carrier: string | null;
    id: string;
    notes: string | null;
    occurredAt: string;
    status: FulfillmentStatusValue;
    trackingNumber: string | null;
  }[];
  fulfillmentStatus: FulfillmentStatusValue;
  hasDigitalItems: boolean;
  hasPhysicalItems: boolean;
  id: string;
  items: {
    fulfilledQuantity: number;
    fulfillableQuantity: number;
    id: string;
    name: string;
    productType: string;
    quantity: number;
    sku: string;
    totalAmountCents: number;
    unitAmountCents: number;
  }[];
  orderNumber: string;
  paymentStatus: PaymentStatusValue;
  payments: {
    amountCents: number;
    createdAt: string;
    currency: string;
    failedAt: string | null;
    failureCode: string | null;
    failureMessage: string | null;
    id: string;
    paidAt: string | null;
    provider: string;
    providerPaymentId: string;
    status: PaymentStatusValue;
  }[];
  placedAt: string;
  refundAmountCents: number;
  refundStatus: ReturnType<typeof getRefundSummary>["status"];
  refunds: {
    amountCents: number;
    currency: string;
    id: string;
    processedAt: string | null;
    provider: string;
    providerRefundId: string;
    reason: string;
    requestedAt: string;
    status: RefundStatusValue;
  }[];
  shippingCents: number;
  source: StoreSourceValue;
  sourceOrderId: string;
  status: OrderStatusValue;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  updatedAt: string;
};

export async function getOrderTableRows(): Promise<OrderTableRow[]> {
  const orders = await readOrderTableRecords();

  return orders.map((order) => {
    const orderStatus = order.status as OrderStatusValue;
    const refundSummary = getRefundSummary(
      order.refunds.map((refund) => ({
        amountCents: refund.amountCents,
        status: refund.status as RefundStatusValue,
      })),
    );

    return {
      currency: order.currency,
      customerEmail: order.customer.email,
      customerName: getCustomerName(order.customer),
      fulfillmentStatus: order.fulfillmentStatus as FulfillmentStatusValue,
      id: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: getPrimaryPaymentStatus(
        order.payments.map(
          (payment) => payment.status as PaymentStatusValue,
        ),
        orderStatus,
      ),
      placedAt: order.placedAt.toISOString(),
      refundAmountCents: refundSummary.amountCents,
      refundStatus: refundSummary.status,
      source: order.source as StoreSourceValue,
      status: orderStatus,
      totalCents: order.totalCents,
    };
  });
}

export async function getOrderDetail(
  orderId: string,
): Promise<OrderDetailDto | null> {
  const order = await readOrderDetailRecord(orderId);

  if (!order) {
    return null;
  }

  const orderStatus = order.status as OrderStatusValue;
  const refundSummary = getRefundSummary(
    order.refunds.map((refund) => ({
      amountCents: refund.amountCents,
      status: refund.status as RefundStatusValue,
    })),
  );

  return {
    canceledAt: order.canceledAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    currency: order.currency,
    customer: {
      city: order.customer.city,
      country: order.customer.country,
      email: order.customer.email,
      lifetimeValueCents: order.customer.lifetimeValueCents,
      name: getCustomerName(order.customer),
      phone: order.customer.phone,
      state: order.customer.state,
    },
    discountCents: order.discountCents,
    disputes: order.disputes.map((dispute) => ({
      amountCents: dispute.amountCents,
      currency: dispute.currency,
      id: dispute.id,
      openedAt: dispute.openedAt.toISOString(),
      provider: dispute.provider,
      providerDisputeId: dispute.providerDisputeId,
      reason: dispute.reason,
      status: dispute.status,
    })),
    fulfillmentEvents: order.fulfillmentEvents.map((event) => ({
      carrier: event.carrier,
      id: event.id,
      notes: event.notes,
      occurredAt: event.occurredAt.toISOString(),
      status: event.status as FulfillmentStatusValue,
      trackingNumber: event.trackingNumber,
    })),
    fulfillmentStatus: order.fulfillmentStatus as FulfillmentStatusValue,
    hasDigitalItems: order.hasDigitalItems,
    hasPhysicalItems: order.hasPhysicalItems,
    id: order.id,
    items: order.items.map((item) => ({
      fulfilledQuantity: item.fulfilledQuantity,
      fulfillableQuantity: item.fulfillableQuantity,
      id: item.id,
      name: item.name,
      productType: item.productType,
      quantity: item.quantity,
      sku: item.sku,
      totalAmountCents: item.totalAmountCents,
      unitAmountCents: item.unitAmountCents,
    })),
    orderNumber: order.orderNumber,
    paymentStatus: getPrimaryPaymentStatus(
      order.payments.map((payment) => payment.status as PaymentStatusValue),
      orderStatus,
    ),
    payments: order.payments.map((payment) => ({
      amountCents: payment.amountCents,
      createdAt: payment.createdAt.toISOString(),
      currency: payment.currency,
      failedAt: payment.failedAt?.toISOString() ?? null,
      failureCode: payment.failureCode,
      failureMessage: payment.failureMessage,
      id: payment.id,
      paidAt: payment.paidAt?.toISOString() ?? null,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      status: payment.status as PaymentStatusValue,
    })),
    placedAt: order.placedAt.toISOString(),
    refundAmountCents: refundSummary.amountCents,
    refundStatus: refundSummary.status,
    refunds: order.refunds.map((refund) => ({
      amountCents: refund.amountCents,
      currency: refund.currency,
      id: refund.id,
      processedAt: refund.processedAt?.toISOString() ?? null,
      provider: refund.provider,
      providerRefundId: refund.providerRefundId,
      reason: refund.reason,
      requestedAt: refund.requestedAt.toISOString(),
      status: refund.status as RefundStatusValue,
    })),
    shippingCents: order.shippingCents,
    source: order.source as StoreSourceValue,
    sourceOrderId: order.sourceOrderId,
    status: orderStatus,
    subtotalCents: order.subtotalCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    updatedAt: order.updatedAt.toISOString(),
  };
}

function getCustomerName(customer: { firstName: string; lastName: string }) {
  return `${customer.firstName} ${customer.lastName}`;
}
