import { prisma } from "@/lib/db/prisma";

export async function readCustomerDetailRecord(customerId: string) {
  return prisma.customer.findUnique({
    select: {
      city: true,
      country: true,
      createdAt: true,
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      lifetimeValueCents: true,
      notes: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          authorLabel: true,
          body: true,
          createdAt: true,
          id: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      },
      orders: {
        orderBy: {
          placedAt: "desc",
        },
        select: {
          currency: true,
          disputes: {
            select: {
              amountCents: true,
              currency: true,
              id: true,
              openedAt: true,
              providerDisputeId: true,
              status: true,
            },
          },
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
              currency: true,
              id: true,
              providerRefundId: true,
              requestedAt: true,
              status: true,
            },
          },
          status: true,
          totalCents: true,
        },
      },
      phone: true,
      state: true,
    },
    where: {
      id: customerId,
    },
  });
}

export async function createCustomerNote(input: {
  authorLabel: string;
  body: string;
  customerId: string;
}) {
  await prisma.customerNote.create({
    data: {
      authorLabel: input.authorLabel,
      body: input.body,
      customerId: input.customerId,
    },
  });
}

