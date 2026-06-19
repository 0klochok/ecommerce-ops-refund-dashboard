import { z } from "zod";
import { getPrimaryPaymentStatus } from "@/lib/domain/orders";
import {
  createCustomerNote,
  readCustomerDetailRecord,
} from "@/server/repositories/customers";

export const customerNoteSchema = z.object({
  body: z.string().trim().min(1).max(500),
  customerId: z.string().trim().min(1),
});

export type CustomerDetailDto = Awaited<ReturnType<typeof getCustomerDetail>>;

export async function getCustomerDetail(customerId: string) {
  const customer = await readCustomerDetailRecord(customerId);

  if (!customer) {
    return null;
  }

  const refunds = customer.orders.flatMap((order) =>
    order.refunds.map((refund) => ({
      amountCents: refund.amountCents,
      currency: refund.currency,
      id: refund.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      providerRefundId: refund.providerRefundId,
      requestedAt: refund.requestedAt.toISOString(),
      status: refund.status,
    })),
  );
  const disputes = customer.orders.flatMap((order) =>
    order.disputes.map((dispute) => ({
      amountCents: dispute.amountCents,
      currency: dispute.currency,
      id: dispute.id,
      openedAt: dispute.openedAt.toISOString(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      providerDisputeId: dispute.providerDisputeId,
      status: dispute.status,
    })),
  );
  const completedRefundAmountCents = refunds
    .filter((refund) => refund.status === "SUCCEEDED")
    .reduce((sum, refund) => sum + refund.amountCents, 0);

  return {
    city: customer.city,
    country: customer.country,
    createdAt: customer.createdAt.toISOString(),
    disputes,
    email: customer.email,
    id: customer.id,
    lifetimeRevenueCents: customer.orders
      .filter((order) =>
        ["DISPUTED", "PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(
          order.status,
        ),
      )
      .reduce((sum, order) => sum + order.totalCents, 0),
    lifetimeValueCents: customer.lifetimeValueCents,
    name: `${customer.firstName} ${customer.lastName}`,
    notes: customer.notes.map((note) => ({
      authorLabel: note.authorLabel,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      id: note.id,
      order: note.order,
    })),
    orders: customer.orders.map((order) => ({
      currency: order.currency,
      id: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: getPrimaryPaymentStatus(
        order.payments.map((payment) => payment.status),
        order.status,
      ),
      placedAt: order.placedAt.toISOString(),
      refundAmountCents: order.refunds
        .filter((refund) => refund.status === "SUCCEEDED")
        .reduce((sum, refund) => sum + refund.amountCents, 0),
      status: order.status,
      totalCents: order.totalCents,
    })),
    phone: customer.phone,
    refundCount: refunds.length,
    refunds,
    state: customer.state,
    totalRefundedCents: completedRefundAmountCents,
  };
}

export async function addCustomerNote(input: {
  body: string;
  customerId: string;
}) {
  const parsed = customerNoteSchema.parse(input);

  await createCustomerNote({
    authorLabel: "Ops demo agent",
    body: parsed.body,
    customerId: parsed.customerId,
  });
}

