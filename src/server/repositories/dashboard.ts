import { prisma } from "@/lib/db/prisma";

export async function readDashboardRecords() {
  const [orders, refunds, payments, disputes] = await Promise.all([
    prisma.order.findMany({
      orderBy: {
        placedAt: "asc",
      },
      select: {
        fulfillmentStatus: true,
        hasPhysicalItems: true,
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
        status: true,
        totalCents: true,
      },
    }),
    prisma.refund.findMany({
      orderBy: {
        requestedAt: "asc",
      },
      select: {
        amountCents: true,
        processedAt: true,
        requestedAt: true,
        status: true,
      },
    }),
    prisma.payment.findMany({
      select: {
        status: true,
      },
    }),
    prisma.dispute.findMany({
      select: {
        amountCents: true,
        status: true,
      },
    }),
  ]);

  return {
    disputes,
    orders,
    payments,
    refunds,
  };
}
