import { prisma } from "@/lib/db/prisma";

export async function readOrderTableRecords() {
  return prisma.order.findMany({
    orderBy: {
      placedAt: "desc",
    },
    select: {
      currency: true,
      customer: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      fulfillmentStatus: true,
      id: true,
      orderNumber: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          status: true,
        },
        take: 1,
      },
      placedAt: true,
      refunds: {
        select: {
          amountCents: true,
          status: true,
        },
      },
      source: true,
      status: true,
      totalCents: true,
    },
  });
}

export async function readOrderDetailRecord(orderId: string) {
  return prisma.order.findUnique({
    where: {
      id: orderId,
    },
    select: {
      canceledAt: true,
      createdAt: true,
      currency: true,
      customer: {
        select: {
          city: true,
          country: true,
          email: true,
          firstName: true,
          lastName: true,
          lifetimeValueCents: true,
          phone: true,
          state: true,
        },
      },
      discountCents: true,
      disputes: {
        orderBy: {
          openedAt: "desc",
        },
        select: {
          amountCents: true,
          currency: true,
          id: true,
          openedAt: true,
          provider: true,
          providerDisputeId: true,
          reason: true,
          status: true,
        },
      },
      fulfillmentEvents: {
        orderBy: {
          occurredAt: "desc",
        },
        select: {
          carrier: true,
          id: true,
          notes: true,
          occurredAt: true,
          status: true,
          trackingNumber: true,
        },
      },
      fulfillmentStatus: true,
      hasDigitalItems: true,
      hasPhysicalItems: true,
      id: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          fulfilledQuantity: true,
          fulfillableQuantity: true,
          id: true,
          name: true,
          productType: true,
          quantity: true,
          sku: true,
          totalAmountCents: true,
          unitAmountCents: true,
        },
      },
      orderNumber: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          amountCents: true,
          createdAt: true,
          currency: true,
          failedAt: true,
          failureCode: true,
          failureMessage: true,
          id: true,
          paidAt: true,
          provider: true,
          providerPaymentId: true,
          status: true,
        },
      },
      placedAt: true,
      refunds: {
        orderBy: {
          requestedAt: "desc",
        },
        select: {
          amountCents: true,
          currency: true,
          id: true,
          processedAt: true,
          provider: true,
          providerRefundId: true,
          reason: true,
          requestedAt: true,
          status: true,
        },
      },
      shippingCents: true,
      source: true,
      sourceOrderId: true,
      status: true,
      subtotalCents: true,
      taxCents: true,
      totalCents: true,
      updatedAt: true,
    },
  });
}
