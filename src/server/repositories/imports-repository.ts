import {
  FulfillmentStatus,
  ImportBatchStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductType,
  StoreSource,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  ImportedOrderInput,
  OrderImportRepository,
} from "@/server/services/order-import-service";

export const orderImportRepository: OrderImportRepository = {
  async completeBatch(batchId, input) {
    await prisma.importBatch.update({
      data: {
        completedAt: input.completedAt,
        failureCount: input.failureCount,
        notes: input.notes,
        status: ImportBatchStatus.COMPLETED,
        successCount: input.successCount,
      },
      where: {
        id: batchId,
      },
    });
  },
  async createBatch(input) {
    return prisma.importBatch.create({
      data: {
        fileName: input.fileName,
        importedAt: input.importedAt,
        rowCount: input.rowCount,
        source: StoreSource.CSV_IMPORT,
        status: ImportBatchStatus.PROCESSING,
      },
      select: {
        id: true,
      },
    });
  },
  async createImportedOrder(input) {
    await createImportedOrder(input);
  },
  async failBatch(batchId, input) {
    await prisma.importBatch.update({
      data: {
        completedAt: input.completedAt,
        failureCount: input.failureCount,
        notes: input.notes,
        status: ImportBatchStatus.FAILED,
        successCount: 0,
      },
      where: {
        id: batchId,
      },
    });
  },
  async findExistingOrderNumbers(orderNumbers) {
    const existingOrders = await prisma.order.findMany({
      select: {
        orderNumber: true,
      },
      where: {
        orderNumber: {
          in: [...orderNumbers],
        },
      },
    });

    return new Set(existingOrders.map((order) => order.orderNumber));
  },
  async findOrCreateCustomer(input) {
    const existingCustomer = await prisma.customer.findUnique({
      select: {
        id: true,
      },
      where: {
        email: input.email,
      },
    });

    if (existingCustomer) {
      return {
        created: false,
        id: existingCustomer.id,
      };
    }

    const nameParts = splitCustomerName(input.name);
    const customer = await prisma.customer.create({
      data: {
        email: input.email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
      },
      select: {
        id: true,
      },
    });

    return {
      created: true,
      id: customer.id,
    };
  },
};

async function createImportedOrder(input: ImportedOrderInput) {
  const subtotalCents = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmountCents,
    0,
  );
  const hasPhysicalItems = input.items.some(
    (item) => item.productType === ProductType.PHYSICAL,
  );
  const hasDigitalItems = input.items.some(
    (item) => item.productType !== ProductType.PHYSICAL,
  );
  const orderStatus = getOrderStatus(input.paymentStatus);
  const safeOrderNumber = input.orderNumber.replace(/[^a-z0-9]/gi, "_");
  const paymentProviderId = `pi_csv_${input.importBatchId.slice(-8)}_${safeOrderNumber}`;

  await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.create({
      data: {
        currency: "USD",
        customerId: input.customerId,
        discountCents: 0,
        fulfillmentStatus: input.fulfillmentStatus as FulfillmentStatus,
        hasDigitalItems,
        hasPhysicalItems,
        importBatchId: input.importBatchId,
        items: {
          create: input.items.map((item) => {
            const totalAmountCents = item.quantity * item.unitAmountCents;
            const isPhysical = item.productType === ProductType.PHYSICAL;

            return {
              fulfilledQuantity:
                input.fulfillmentStatus === FulfillmentStatus.FULFILLED
                  ? item.quantity
                  : 0,
              fulfillableQuantity: isPhysical ? item.quantity : 0,
              name: item.name,
              productType: item.productType as ProductType,
              quantity: item.quantity,
              sku: item.sku,
              totalAmountCents,
              unitAmountCents: item.unitAmountCents,
            };
          }),
        },
        orderNumber: input.orderNumber,
        placedAt: input.orderDate,
        shippingCents: 0,
        source: input.source as StoreSource,
        sourceOrderId: `csv_${safeOrderNumber}`,
        status: orderStatus,
        subtotalCents,
        taxCents: 0,
        totalCents: subtotalCents,
      },
      select: {
        id: true,
      },
    });

    await transaction.payment.create({
      data: {
        amountCents: subtotalCents,
        currency: "USD",
        customerId: input.customerId,
        failedAt:
          input.paymentStatus === PaymentStatus.FAILED ? input.orderDate : null,
        failureCode:
          input.paymentStatus === PaymentStatus.FAILED
            ? "csv_demo_failed"
            : null,
        failureMessage:
          input.paymentStatus === PaymentStatus.FAILED
            ? "Demo CSV import payment failure."
            : null,
        orderId: order.id,
        paidAt: isPaidPaymentStatus(input.paymentStatus) ? input.orderDate : null,
        provider: PaymentProvider.MOCK_STRIPE,
        providerPaymentId: paymentProviderId,
        status: input.paymentStatus as PaymentStatus,
      },
    });

    if (hasPhysicalItems) {
      await transaction.fulfillmentEvent.create({
        data: {
          notes: "Demo fulfillment event created from CSV import.",
          occurredAt: input.orderDate,
          orderId: order.id,
          status: input.fulfillmentStatus as FulfillmentStatus,
        },
      });
    }

    if (isPaidPaymentStatus(input.paymentStatus) && orderStatus !== "CANCELED") {
      await transaction.customer.update({
        data: {
          lifetimeValueCents: {
            increment: subtotalCents,
          },
        },
        where: {
          id: input.customerId,
        },
      });
    }
  });
}

function getOrderStatus(paymentStatus: string) {
  if (paymentStatus === PaymentStatus.FAILED) {
    return OrderStatus.PAYMENT_FAILED;
  }

  if (paymentStatus === PaymentStatus.CANCELED) {
    return OrderStatus.CANCELED;
  }

  if (paymentStatus === PaymentStatus.REFUNDED) {
    return OrderStatus.REFUNDED;
  }

  if (paymentStatus === PaymentStatus.PARTIALLY_REFUNDED) {
    return OrderStatus.PARTIALLY_REFUNDED;
  }

  if (paymentStatus === PaymentStatus.DISPUTED) {
    return OrderStatus.DISPUTED;
  }

  if (paymentStatus === PaymentStatus.SUCCEEDED) {
    return OrderStatus.PAID;
  }

  return OrderStatus.PENDING;
}

function isPaidPaymentStatus(paymentStatus: string) {
  const paidPaymentStatuses = new Set<string>([
    PaymentStatus.DISPUTED,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
    PaymentStatus.SUCCEEDED,
  ]);

  return paidPaymentStatuses.has(paymentStatus);
}

function splitCustomerName(name: string) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? "Demo";
  const lastName = parts.slice(1).join(" ") || "Customer";

  return {
    firstName,
    lastName,
  };
}
