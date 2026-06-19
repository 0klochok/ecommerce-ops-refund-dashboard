import { prisma } from "@/lib/db/prisma";

export async function readRefundsAndDisputes() {
  const [refunds, disputes] = await Promise.all([
    prisma.refund.findMany({
      orderBy: {
        requestedAt: "desc",
      },
      select: {
        amountCents: true,
        currency: true,
        id: true,
        order: {
          select: {
            customer: {
              select: {
                email: true,
                firstName: true,
                id: true,
                lastName: true,
              },
            },
            id: true,
            orderNumber: true,
          },
        },
        processedAt: true,
        providerRefundId: true,
        reason: true,
        requestedAt: true,
        status: true,
      },
    }),
    prisma.dispute.findMany({
      orderBy: {
        openedAt: "desc",
      },
      select: {
        amountCents: true,
        currency: true,
        id: true,
        openedAt: true,
        order: {
          select: {
            customer: {
              select: {
                email: true,
                firstName: true,
                id: true,
                lastName: true,
              },
            },
            id: true,
            orderNumber: true,
          },
        },
        providerDisputeId: true,
        reason: true,
        status: true,
      },
    }),
  ]);

  return {
    disputes,
    refunds,
  };
}

