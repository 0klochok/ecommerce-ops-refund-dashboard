import type {
  StoreAdapter,
  StoreAdapterOrder,
  StoreImportRequest,
  StoreImportResult,
} from "./types";

const DEFAULT_REFERENCE_DATE = "2026-06-15T12:00:00.000Z";
const DAY_MS = 24 * 60 * 60 * 1000;

type MockStoreAdapterOptions = {
  referenceDate?: string;
  seed?: number;
};

function createPrng(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const demoProducts = [
  {
    name: "Insulated Travel Mug",
    productType: "physical",
    sku: "PHY-TRAVEL-MUG",
    unitAmountCents: 2899,
  },
  {
    name: "Cork Desk Mat",
    productType: "physical",
    sku: "PHY-DESK-MAT",
    unitAmountCents: 4499,
  },
  {
    name: "Operations Checklist Templates",
    productType: "digital",
    sku: "DIG-TEMPLATE",
    unitAmountCents: 2900,
  },
  {
    name: "Demo Gift Card",
    productType: "gift_card",
    sku: "GIFTCARD-50",
    unitAmountCents: 5000,
  },
] as const;

export class MockStoreAdapter implements StoreAdapter {
  readonly source = "mock-store" as const;

  private readonly referenceDate: Date;
  private readonly seed: number;

  constructor(options: MockStoreAdapterOptions = {}) {
    this.referenceDate = new Date(options.referenceDate ?? DEFAULT_REFERENCE_DATE);
    this.seed = options.seed ?? 8_675_309;
  }

  async importOrders(
    request: StoreImportRequest = {},
  ): Promise<StoreImportResult> {
    const limit = request.limit ?? 12;
    const since = request.since ? new Date(request.since) : null;
    const orders = this.createOrders(limit).filter(
      (order) => since === null || new Date(order.placedAt) >= since,
    );

    return {
      fetchedAt: this.referenceDate.toISOString(),
      orders,
      source: this.source,
    };
  }

  private createOrders(limit: number): StoreAdapterOrder[] {
    const random = createPrng(this.seed);

    return Array.from({ length: limit }, (_, index) => {
      const orderNumber = index + 1;
      const lineItems = [0, 1 + (index % 3)].map((productOffset) => {
        const product =
          demoProducts[(index + productOffset) % demoProducts.length];
        const quantity =
          product.productType === "physical" ? 1 + Math.floor(random() * 2) : 1;

        return {
          name: product.name,
          productType: product.productType,
          quantity,
          sku: product.sku,
          totalAmountCents: product.unitAmountCents * quantity,
          unitAmountCents: product.unitAmountCents,
        };
      });
      const hasPhysicalItems = lineItems.some(
        (lineItem) => lineItem.productType === "physical",
      );
      const totalCents = lineItems.reduce(
        (sum, lineItem) => sum + lineItem.totalAmountCents,
        0,
      );
      const placedAt = new Date(
        this.referenceDate.getTime() - (index + 1) * DAY_MS,
      );

      return {
        currency: "USD",
        customer: {
          email: `mock.adapter.customer.${String(orderNumber).padStart(3, "0")}@example.test`,
          firstName: `Mock${orderNumber}`,
          lastName: "Customer",
          sourceCustomerId: `mock_customer_${String(orderNumber).padStart(6, "0")}`,
        },
        fulfillmentStatus: hasPhysicalItems
          ? index % 5 === 0
            ? "delayed"
            : "fulfilled"
          : "not_required",
        lineItems,
        orderNumber: `ORD-ADAPTER-${String(orderNumber).padStart(5, "0")}`,
        placedAt: placedAt.toISOString(),
        source: this.source,
        sourceOrderId: `mock_adapter_order_${String(orderNumber).padStart(6, "0")}`,
        status: index % 7 === 0 ? "partially_refunded" : "paid",
        totalCents,
      };
    });
  }
}

export const mockStoreAdapter = new MockStoreAdapter();
