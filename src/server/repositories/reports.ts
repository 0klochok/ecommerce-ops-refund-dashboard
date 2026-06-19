import { AlertStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function readWeeklyOpsReportRecords({
  weekEnd,
  weekStart,
}: {
  weekEnd: Date;
  weekStart: Date;
}) {
  const [orders, refunds, disputes, fulfillmentDelays, alerts] =
    await Promise.all([
      prisma.order.findMany({
        orderBy: {
          placedAt: "asc",
        },
        select: {
          currency: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          id: true,
          orderNumber: true,
          placedAt: true,
          status: true,
          totalCents: true,
        },
        where: {
          placedAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      }),
      prisma.refund.findMany({
        orderBy: {
          requestedAt: "asc",
        },
        select: {
          amountCents: true,
          currency: true,
          id: true,
          order: {
            select: {
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              orderNumber: true,
            },
          },
          providerRefundId: true,
          reason: true,
          requestedAt: true,
          status: true,
        },
        where: {
          requestedAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      }),
      prisma.dispute.findMany({
        orderBy: {
          openedAt: "asc",
        },
        select: {
          amountCents: true,
          currency: true,
          id: true,
          order: {
            select: {
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              orderNumber: true,
            },
          },
          providerDisputeId: true,
          reason: true,
          openedAt: true,
          status: true,
        },
        where: {
          openedAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      }),
      prisma.order.findMany({
        orderBy: {
          placedAt: "asc",
        },
        select: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          id: true,
          orderNumber: true,
          placedAt: true,
          status: true,
        },
        where: {
          hasPhysicalItems: true,
          placedAt: {
            lt: new Date(weekEnd.getTime() - 72 * 60 * 60 * 1000),
          },
          status: {
            not: "CANCELED",
          },
          NOT: {
            fulfillmentStatus: {
              in: ["CANCELED", "FULFILLED", "NOT_REQUIRED"],
            },
          },
        },
      }),
      prisma.alert.findMany({
        orderBy: {
          triggeredAt: "asc",
        },
        select: {
          createdAt: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          description: true,
          id: true,
          order: {
            select: {
              orderNumber: true,
            },
          },
          severity: true,
          status: true,
          title: true,
          triggeredAt: true,
          type: true,
        },
        where: {
          status: AlertStatus.OPEN,
        },
      }),
    ]);

  return {
    alerts,
    disputes,
    fulfillmentDelays,
    orders,
    refunds,
  };
}

