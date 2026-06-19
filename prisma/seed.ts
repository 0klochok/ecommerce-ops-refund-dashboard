import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import {
  AlertSeverity,
  AlertStatus,
  AlertType,
  DisputeStatus,
  FulfillmentStatus,
  ImportBatchStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
  ProductType,
  RefundStatus,
  StoreSource,
  WebhookProcessingStatus,
  WebhookProvider,
} from "../src/generated/prisma/client";

loadEnv({
  path: existsSync(".env.local") ? ".env.local" : ".env.example",
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for Prisma seed data.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const REFERENCE_DATE = new Date("2026-06-15T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type ProductSeed = {
  sku: string;
  name: string;
  type: ProductType;
  unitAmountCents: number;
};

type SeededOrder = {
  id: string;
  customerId: string;
  orderNumber: string;
  totalCents: number;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  placedAt: Date;
  hasPhysicalItems: boolean;
};

type SeededPayment = {
  id: string;
  customerId: string;
  orderId: string;
  providerPaymentId: string;
  amountCents: number;
  status: PaymentStatus;
};

type SeededRefund = {
  id: string;
  orderId: string;
  paymentId: string | null;
  providerRefundId: string;
  amountCents: number;
  status: RefundStatus;
};

type SeededDispute = {
  id: string;
  orderId: string;
  paymentId: string | null;
  providerDisputeId: string;
  amountCents: number;
  status: DisputeStatus;
};

function createPrng(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const random = createPrng(42_061_526);

function randomInt(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]) {
  return items[randomInt(0, items.length - 1)];
}

function daysAgo(days: number, extraHours = 0) {
  return new Date(REFERENCE_DATE.getTime() - days * DAY_MS - extraHours * HOUR_MS);
}

function hoursAfter(date: Date, hours: number) {
  return new Date(date.getTime() + hours * HOUR_MS);
}

function eventPayload(
  id: string,
  type: string,
  objectId: string,
  amountCents?: number,
) {
  return {
    id,
    livemode: false,
    object: "event",
    type,
    data: {
      object: {
        id: objectId,
        amount: amountCents,
        currency: "usd",
        metadata: {
          fixture: "phase_1_seed_mock",
        },
      },
    },
  };
}

const firstNames = [
  "Avery",
  "Blake",
  "Casey",
  "Dakota",
  "Elliot",
  "Finley",
  "Gray",
  "Harper",
  "Indigo",
  "Jordan",
  "Kai",
  "Logan",
  "Morgan",
  "Nova",
  "Parker",
  "Quinn",
  "Riley",
  "Sage",
  "Taylor",
  "Winter",
] as const;

const lastNames = [
  "Anderson",
  "Bennett",
  "Carter",
  "Diaz",
  "Ellis",
  "Foster",
  "Garcia",
  "Hayes",
  "Ito",
  "Jones",
  "Khan",
  "Lopez",
  "Miller",
  "Nguyen",
  "Owens",
  "Patel",
  "Reed",
  "Smith",
  "Turner",
  "Young",
] as const;

const cities = [
  ["Austin", "TX"],
  ["Boulder", "CO"],
  ["Chicago", "IL"],
  ["Columbus", "OH"],
  ["Denver", "CO"],
  ["Madison", "WI"],
  ["Nashville", "TN"],
  ["Portland", "OR"],
  ["Raleigh", "NC"],
  ["Seattle", "WA"],
] as const;

const products: ProductSeed[] = [
  {
    sku: "PHY-TRAVEL-MUG",
    name: "Insulated Travel Mug",
    type: ProductType.PHYSICAL,
    unitAmountCents: 2899,
  },
  {
    sku: "PHY-DESK-MAT",
    name: "Cork Desk Mat",
    type: ProductType.PHYSICAL,
    unitAmountCents: 4499,
  },
  {
    sku: "PHY-CABLE-KIT",
    name: "Travel Cable Kit",
    type: ProductType.PHYSICAL,
    unitAmountCents: 3499,
  },
  {
    sku: "PHY-PACK-CUBE",
    name: "Packing Cube Set",
    type: ProductType.PHYSICAL,
    unitAmountCents: 3999,
  },
  {
    sku: "PHY-NOTEBOOK",
    name: "Recycled Notebook Trio",
    type: ProductType.PHYSICAL,
    unitAmountCents: 2199,
  },
  {
    sku: "PHY-BUNDLE",
    name: "Remote Work Starter Bundle",
    type: ProductType.PHYSICAL,
    unitAmountCents: 11900,
  },
  {
    sku: "DIG-PLANNER",
    name: "Digital Weekly Planner",
    type: ProductType.DIGITAL,
    unitAmountCents: 1900,
  },
  {
    sku: "DIG-TEMPLATE",
    name: "Operations Checklist Templates",
    type: ProductType.DIGITAL,
    unitAmountCents: 2900,
  },
  {
    sku: "DIG-WARRANTY",
    name: "Extended Digital Warranty",
    type: ProductType.DIGITAL,
    unitAmountCents: 1299,
  },
  {
    sku: "GIFTCARD-50",
    name: "Demo Gift Card",
    type: ProductType.GIFT_CARD,
    unitAmountCents: 5000,
  },
];

async function clearDemoData() {
  await prisma.webhookEvent.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.fulfillmentEvent.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.customer.deleteMany();
}

async function main() {
  await clearDemoData();

  const importBatches = await Promise.all([
    prisma.importBatch.create({
      data: {
        completedAt: daysAgo(87),
        failureCount: 2,
        fileName: "mock-store-orders-2026-03.csv",
        importedAt: daysAgo(87, 2),
        notes: "Synthetic March order import for portfolio demo.",
        rowCount: 71,
        source: StoreSource.CSV_IMPORT,
        status: ImportBatchStatus.COMPLETED,
        successCount: 69,
      },
    }),
    prisma.importBatch.create({
      data: {
        completedAt: daysAgo(43),
        failureCount: 0,
        fileName: "mock-store-orders-2026-04.csv",
        importedAt: daysAgo(43, 3),
        notes: "Synthetic April order import for portfolio demo.",
        rowCount: 64,
        source: StoreSource.MOCK_STORE,
        status: ImportBatchStatus.COMPLETED,
        successCount: 64,
      },
    }),
    prisma.importBatch.create({
      data: {
        completedAt: daysAgo(8),
        failureCount: 3,
        fileName: "mock-store-orders-2026-06.csv",
        importedAt: daysAgo(8, 5),
        notes: "Synthetic June order import with a few rejected demo rows.",
        rowCount: 52,
        source: StoreSource.MOCK_STORE,
        status: ImportBatchStatus.COMPLETED,
        successCount: 49,
      },
    }),
  ]);

  const customers = await Promise.all(
    Array.from({ length: 85 }, (_, index) => {
      const customerNumber = index + 1;
      const [city, state] = cities[index % cities.length];

      return prisma.customer.create({
        data: {
          city,
          country: "US",
          createdAt: daysAgo(140 - (index % 70)),
          email: `demo.customer.${String(customerNumber).padStart(3, "0")}@example.test`,
          firstName: firstNames[index % firstNames.length],
          lastName: lastNames[(index * 3) % lastNames.length],
          phone: `+155501${String(customerNumber).padStart(4, "0")}`,
          state,
        },
      });
    }),
  );

  const seededOrders: SeededOrder[] = [];
  const seededPayments: SeededPayment[] = [];
  const seededRefunds: SeededRefund[] = [];
  const seededDisputes: SeededDispute[] = [];
  const revenueByCustomer = new Map<string, number>();

  for (let index = 1; index <= 180; index += 1) {
    const isCanceled = index % 29 === 0;
    const isPaymentFailed = !isCanceled && index % 17 === 0;
    const isDisputed = !isCanceled && !isPaymentFailed && index % 23 === 0;
    const isRefunded = !isCanceled && !isPaymentFailed && !isDisputed && index % 11 === 0;
    const isPartiallyRefunded =
      !isCanceled && !isPaymentFailed && !isDisputed && !isRefunded && index % 7 === 0;
    const orderStatus = isCanceled
      ? OrderStatus.CANCELED
      : isPaymentFailed
        ? OrderStatus.PAYMENT_FAILED
        : isDisputed
          ? OrderStatus.DISPUTED
          : isRefunded
            ? OrderStatus.REFUNDED
            : isPartiallyRefunded
              ? OrderStatus.PARTIALLY_REFUNDED
              : OrderStatus.PAID;
    const customer = isPaymentFailed
      ? customers[index % 4]
      : customers[(index * 7 + randomInt(0, 12)) % customers.length];
    const placedAt = daysAgo(index % 92, index % 12);
    const orderProducts =
      index % 5 === 0
        ? [products[6], products[7], products[9]]
        : index % 4 === 0
          ? [products[index % 6], products[6], products[(index + 3) % 6]]
          : [products[index % 6], products[(index + 2) % 6], products[(index + 4) % 6]];
    const itemCount = index % 3 === 0 ? 3 : 2;
    const selectedProducts = orderProducts.slice(0, itemCount);
    const itemDrafts = selectedProducts.map((product, itemIndex) => {
      const quantity = product.type === ProductType.DIGITAL || product.type === ProductType.GIFT_CARD
        ? 1
        : 1 + ((index + itemIndex) % 2);

      return {
        product,
        quantity,
        totalAmountCents: product.unitAmountCents * quantity,
      };
    });
    const subtotalCents = itemDrafts.reduce((sum, item) => sum + item.totalAmountCents, 0);
    const discountCents = index % 10 === 0 ? 500 : 0;
    const hasPhysicalItems = itemDrafts.some((item) => item.product.type === ProductType.PHYSICAL);
    const hasDigitalItems = itemDrafts.some((item) => item.product.type !== ProductType.PHYSICAL);
    const shippingCents = hasPhysicalItems ? 599 + (index % 4) * 100 : 0;
    const taxableCents = Math.max(subtotalCents - discountCents + shippingCents, 0);
    const taxCents = Math.round(taxableCents * 0.0825);
    const totalCents = taxableCents + taxCents;
    const fulfillmentStatus = !hasPhysicalItems
      ? FulfillmentStatus.NOT_REQUIRED
      : isCanceled
        ? FulfillmentStatus.CANCELED
        : index % 13 === 0
          ? FulfillmentStatus.DELAYED
          : index % 9 === 0
            ? FulfillmentStatus.UNFULFILLED
            : index % 6 === 0
              ? FulfillmentStatus.PARTIALLY_FULFILLED
              : FulfillmentStatus.FULFILLED;

    const order = await prisma.order.create({
      data: {
        canceledAt: isCanceled ? hoursAfter(placedAt, 6) : null,
        currency: "USD",
        customerId: customer.id,
        discountCents,
        fulfillmentStatus,
        hasDigitalItems,
        hasPhysicalItems,
        importBatchId: importBatches[index % importBatches.length].id,
        orderNumber: `ORD-DEMO-${String(index).padStart(5, "0")}`,
        placedAt,
        shippingCents,
        source: index % 8 === 0 ? StoreSource.CSV_IMPORT : StoreSource.MOCK_STORE,
        sourceOrderId: `mock_order_${String(index).padStart(6, "0")}`,
        status: orderStatus,
        subtotalCents,
        taxCents,
        totalCents,
      },
    });

    await prisma.orderItem.createMany({
      data: itemDrafts.map(({ product, quantity, totalAmountCents }) => {
        const isPhysical = product.type === ProductType.PHYSICAL;
        const fulfilledQuantity =
          !isPhysical || fulfillmentStatus === FulfillmentStatus.CANCELED
            ? 0
            : fulfillmentStatus === FulfillmentStatus.FULFILLED
              ? quantity
              : fulfillmentStatus === FulfillmentStatus.PARTIALLY_FULFILLED
                ? Math.max(1, quantity - 1)
                : 0;

        return {
          fulfilledQuantity,
          fulfillableQuantity: isPhysical ? quantity : 0,
          name: product.name,
          orderId: order.id,
          productType: product.type,
          quantity,
          sku: product.sku,
          totalAmountCents,
          unitAmountCents: product.unitAmountCents,
        };
      }),
    });

    seededOrders.push({
      customerId: customer.id,
      fulfillmentStatus,
      hasPhysicalItems,
      id: order.id,
      orderNumber: order.orderNumber,
      placedAt,
      status: orderStatus,
      totalCents,
    });

    if (!isCanceled) {
      const paymentStatus = isPaymentFailed
        ? PaymentStatus.FAILED
        : isDisputed
          ? PaymentStatus.DISPUTED
          : isRefunded
            ? PaymentStatus.REFUNDED
            : isPartiallyRefunded
              ? PaymentStatus.PARTIALLY_REFUNDED
              : PaymentStatus.SUCCEEDED;
      const providerPaymentId = `pi_mock_${String(index).padStart(6, "0")}`;
      const payment = await prisma.payment.create({
        data: {
          amountCents: totalCents,
          currency: "USD",
          customerId: customer.id,
          failedAt: isPaymentFailed ? hoursAfter(placedAt, 1) : null,
          failureCode: isPaymentFailed ? pick(["card_declined", "insufficient_funds"]) : null,
          failureMessage: isPaymentFailed
            ? "Mock payment failed for deterministic demo data."
            : null,
          orderId: order.id,
          paidAt: isPaymentFailed ? null : hoursAfter(placedAt, 1),
          provider: PaymentProvider.MOCK_STRIPE,
          providerPaymentId,
          status: paymentStatus,
        },
      });

      seededPayments.push({
        amountCents: totalCents,
        customerId: customer.id,
        id: payment.id,
        orderId: order.id,
        providerPaymentId,
        status: paymentStatus,
      });

      await prisma.webhookEvent.create({
        data: {
          eventType: isPaymentFailed
            ? "payment_intent.payment_failed"
            : "payment_intent.succeeded",
          payload: eventPayload(
            `evt_mock_payment_${String(index).padStart(6, "0")}`,
            isPaymentFailed ? "payment_intent.payment_failed" : "payment_intent.succeeded",
            providerPaymentId,
            totalCents,
          ),
          paymentId: payment.id,
          processedAt: hoursAfter(placedAt, 1),
          provider: WebhookProvider.MOCK_STRIPE,
          providerEventId: `evt_mock_payment_${String(index).padStart(6, "0")}`,
          receivedAt: hoursAfter(placedAt, 1),
          status: WebhookProcessingStatus.PROCESSED,
        },
      });

      if (paymentStatus !== PaymentStatus.FAILED) {
        revenueByCustomer.set(
          customer.id,
          (revenueByCustomer.get(customer.id) ?? 0) + totalCents,
        );
      }

      if (isRefunded || isPartiallyRefunded) {
        const refundStatus =
          index % 31 === 0
            ? RefundStatus.FAILED
            : index % 19 === 0
              ? RefundStatus.PROCESSING
              : RefundStatus.SUCCEEDED;
        const amountCents = isRefunded
          ? totalCents
          : Math.max(1_500, Math.round(totalCents * (0.2 + (index % 4) * 0.1)));
        const providerRefundId = `re_mock_${String(index).padStart(6, "0")}`;
        const refund = await prisma.refund.create({
          data: {
            amountCents,
            currency: "USD",
            orderId: order.id,
            paymentId: payment.id,
            processedAt: refundStatus === RefundStatus.SUCCEEDED ? hoursAfter(placedAt, 48) : null,
            provider: PaymentProvider.MOCK_STRIPE,
            providerRefundId,
            reason: isRefunded
              ? "Mock full refund for returned order."
              : "Mock partial refund for damaged or missing item.",
            requestedAt: hoursAfter(placedAt, 36),
            status: refundStatus,
          },
        });

        seededRefunds.push({
          amountCents,
          id: refund.id,
          orderId: order.id,
          paymentId: payment.id,
          providerRefundId,
          status: refundStatus,
        });

        await prisma.webhookEvent.create({
          data: {
            eventType: "charge.refunded",
            payload: eventPayload(
              `evt_mock_refund_${String(index).padStart(6, "0")}`,
              "charge.refunded",
              providerRefundId,
              amountCents,
            ),
            paymentId: payment.id,
            processedAt: hoursAfter(placedAt, 49),
            provider: WebhookProvider.MOCK_STRIPE,
            providerEventId: `evt_mock_refund_${String(index).padStart(6, "0")}`,
            receivedAt: hoursAfter(placedAt, 49),
            refundId: refund.id,
            status:
              refundStatus === RefundStatus.FAILED
                ? WebhookProcessingStatus.FAILED
                : WebhookProcessingStatus.PROCESSED,
          },
        });
      }

      if (isDisputed) {
        const disputeStatus =
          index % 69 === 0
            ? DisputeStatus.WON
            : index % 46 === 0
              ? DisputeStatus.LOST
              : index % 2 === 0
                ? DisputeStatus.UNDER_REVIEW
                : DisputeStatus.NEEDS_RESPONSE;
        const amountCents = Math.min(totalCents, Math.round(totalCents * 0.85));
        const providerDisputeId = `dp_mock_${String(index).padStart(6, "0")}`;
        const dispute = await prisma.dispute.create({
          data: {
            amountCents,
            closedAt:
              disputeStatus === DisputeStatus.WON || disputeStatus === DisputeStatus.LOST
                ? hoursAfter(placedAt, 144)
                : null,
            currency: "USD",
            openedAt: hoursAfter(placedAt, 72),
            orderId: order.id,
            paymentId: payment.id,
            provider: PaymentProvider.MOCK_STRIPE,
            providerDisputeId,
            reason: "Mock cardholder dispute for demo workflow.",
            status: disputeStatus,
          },
        });

        seededDisputes.push({
          amountCents,
          id: dispute.id,
          orderId: order.id,
          paymentId: payment.id,
          providerDisputeId,
          status: disputeStatus,
        });

        await prisma.webhookEvent.create({
          data: {
            disputeId: dispute.id,
            eventType: "charge.dispute.created",
            payload: eventPayload(
              `evt_mock_dispute_${String(index).padStart(6, "0")}`,
              "charge.dispute.created",
              providerDisputeId,
              amountCents,
            ),
            paymentId: payment.id,
            processedAt: hoursAfter(placedAt, 73),
            provider: WebhookProvider.MOCK_STRIPE,
            providerEventId: `evt_mock_dispute_${String(index).padStart(6, "0")}`,
            receivedAt: hoursAfter(placedAt, 73),
            status: WebhookProcessingStatus.PROCESSED,
          },
        });
      }
    }

    if (hasPhysicalItems) {
      if (fulfillmentStatus === FulfillmentStatus.FULFILLED) {
        await prisma.fulfillmentEvent.createMany({
          data: [
            {
              carrier: "MockShip",
              notes: "Mock fulfillment picked and packed.",
              occurredAt: hoursAfter(placedAt, 18),
              orderId: order.id,
              status: FulfillmentStatus.PARTIALLY_FULFILLED,
              trackingNumber: `MOCK${String(index).padStart(8, "0")}`,
            },
            {
              carrier: "MockShip",
              notes: "Mock order fulfilled.",
              occurredAt: hoursAfter(placedAt, 36),
              orderId: order.id,
              status: FulfillmentStatus.FULFILLED,
              trackingNumber: `MOCK${String(index).padStart(8, "0")}`,
            },
          ],
        });
      } else {
        await prisma.fulfillmentEvent.create({
          data: {
            carrier: fulfillmentStatus === FulfillmentStatus.CANCELED ? null : "MockShip",
            notes:
              fulfillmentStatus === FulfillmentStatus.DELAYED
                ? "Mock order is past the fulfillment SLA threshold."
                : "Mock fulfillment event for unfulfilled or partially fulfilled order.",
            occurredAt: hoursAfter(placedAt, 24),
            orderId: order.id,
            status:
              fulfillmentStatus === FulfillmentStatus.CANCELED
                ? FulfillmentStatus.CANCELED
                : fulfillmentStatus,
            trackingNumber:
              fulfillmentStatus === FulfillmentStatus.UNFULFILLED ||
              fulfillmentStatus === FulfillmentStatus.DELAYED
                ? null
                : `MOCK${String(index).padStart(8, "0")}`,
          },
        });
      }
    }
  }

  for (const customer of customers) {
    await prisma.customer.update({
      data: {
        lifetimeValueCents: revenueByCustomer.get(customer.id) ?? 0,
      },
      where: {
        id: customer.id,
      },
    });
  }

  const [delayedRule, highRefundRule, failedPaymentRule] = await Promise.all([
    prisma.alertRule.create({
      data: {
        enabled: true,
        name: "Delayed fulfillment SLA",
        severity: AlertSeverity.HIGH,
        thresholdHours: 72,
        type: AlertType.DELAYED_FULFILLMENT,
      },
    }),
    prisma.alertRule.create({
      data: {
        enabled: true,
        name: "High refund amount",
        severity: AlertSeverity.MEDIUM,
        thresholdCents: 10_000,
        type: AlertType.HIGH_REFUND_AMOUNT,
      },
    }),
    prisma.alertRule.create({
      data: {
        enabled: true,
        failureCountThreshold: 2,
        name: "Repeated failed payments",
        severity: AlertSeverity.CRITICAL,
        type: AlertType.REPEATED_FAILED_PAYMENT,
      },
    }),
  ]);

  const delayedOrders = seededOrders.filter(
    (order) =>
      order.hasPhysicalItems &&
      order.status !== OrderStatus.CANCELED &&
      order.fulfillmentStatus !== FulfillmentStatus.FULFILLED &&
      REFERENCE_DATE.getTime() - order.placedAt.getTime() > 72 * HOUR_MS,
  );

  for (const order of delayedOrders.slice(0, 18)) {
    await prisma.alert.create({
      data: {
        customerId: order.customerId,
        description: `${order.orderNumber} is past the 72-hour mock fulfillment threshold.`,
        orderId: order.id,
        ruleId: delayedRule.id,
        severity: delayedRule.severity,
        status: AlertStatus.OPEN,
        title: "Delayed fulfillment needs review",
        triggeredAt: REFERENCE_DATE,
        type: delayedRule.type,
      },
    });
  }

  for (const refund of seededRefunds.filter(
    (item) => item.status === RefundStatus.SUCCEEDED && item.amountCents >= 10_000,
  )) {
    const order = seededOrders.find((seededOrder) => seededOrder.id === refund.orderId);

    await prisma.alert.create({
      data: {
        customerId: order?.customerId,
        description: `${refund.providerRefundId} exceeds the mock high-refund threshold.`,
        orderId: refund.orderId,
        refundId: refund.id,
        ruleId: highRefundRule.id,
        severity: highRefundRule.severity,
        status: AlertStatus.ACKNOWLEDGED,
        title: "High refund amount",
        triggeredAt: REFERENCE_DATE,
        type: highRefundRule.type,
      },
    });
  }

  const failedPaymentCounts = new Map<string, SeededPayment[]>();

  for (const payment of seededPayments.filter((item) => item.status === PaymentStatus.FAILED)) {
    failedPaymentCounts.set(payment.customerId, [
      ...(failedPaymentCounts.get(payment.customerId) ?? []),
      payment,
    ]);
  }

  for (const [customerId, payments] of failedPaymentCounts.entries()) {
    if (payments.length < 2) {
      continue;
    }

    await prisma.alert.create({
      data: {
        customerId,
        description: `${payments.length} mock failed payment attempts detected for one demo customer.`,
        paymentId: payments[0].id,
        ruleId: failedPaymentRule.id,
        severity: failedPaymentRule.severity,
        status: AlertStatus.OPEN,
        title: "Repeated failed payments",
        triggeredAt: REFERENCE_DATE,
        type: failedPaymentRule.type,
      },
    });
  }

  for (let index = 0; index < 30; index += 1) {
    const customer = customers[(index * 5) % customers.length];
    const order = seededOrders.find((item) => item.customerId === customer.id);

    await prisma.customerNote.create({
      data: {
        authorLabel: index % 2 === 0 ? "Ops demo agent" : "Support demo agent",
        body:
          index % 3 === 0
            ? "Synthetic note: customer prefers replacement before refund when inventory is available."
            : "Synthetic note: reviewed mock order history for portfolio demo workflow.",
        customerId: customer.id,
        orderId: order?.id,
      },
    });
  }

  await prisma.webhookEvent.create({
    data: {
      eventType: "checkout.session.completed",
      importBatchId: importBatches[2].id,
      payload: eventPayload(
        "evt_mock_ignored_checkout_000001",
        "checkout.session.completed",
        "cs_mock_000001",
      ),
      provider: WebhookProvider.MOCK_STRIPE,
      providerEventId: "evt_mock_ignored_checkout_000001",
      receivedAt: daysAgo(2),
      status: WebhookProcessingStatus.IGNORED,
    },
  });

  const counts = {
    alertRules: await prisma.alertRule.count(),
    alerts: await prisma.alert.count(),
    customerNotes: await prisma.customerNote.count(),
    customers: await prisma.customer.count(),
    disputes: await prisma.dispute.count(),
    fulfillmentEvents: await prisma.fulfillmentEvent.count(),
    importBatches: await prisma.importBatch.count(),
    orderItems: await prisma.orderItem.count(),
    orders: await prisma.order.count(),
    payments: await prisma.payment.count(),
    refunds: await prisma.refund.count(),
    webhookEvents: await prisma.webhookEvent.count(),
  };

  console.log("Seeded deterministic Phase 1 demo data:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`- ${table}: ${count}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
