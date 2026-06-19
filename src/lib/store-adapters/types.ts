export type StoreAdapterSource =
  | "mock-store"
  | "shopify"
  | "woocommerce"
  | "stripe-only"
  | "csv-import";

export type StoreAdapterProductType = "physical" | "digital" | "gift_card";

export type StoreAdapterOrderStatus =
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "canceled"
  | "payment_failed"
  | "disputed";

export type StoreAdapterFulfillmentStatus =
  | "not_required"
  | "unfulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "delayed"
  | "canceled";

export type StoreAdapterCustomer = {
  email: string;
  firstName: string;
  lastName: string;
  sourceCustomerId: string;
};

export type StoreAdapterLineItem = {
  name: string;
  productType: StoreAdapterProductType;
  quantity: number;
  sku: string;
  totalAmountCents: number;
  unitAmountCents: number;
};

export type StoreAdapterOrder = {
  currency: "USD";
  customer: StoreAdapterCustomer;
  fulfillmentStatus: StoreAdapterFulfillmentStatus;
  lineItems: StoreAdapterLineItem[];
  orderNumber: string;
  placedAt: string;
  source: StoreAdapterSource;
  sourceOrderId: string;
  status: StoreAdapterOrderStatus;
  totalCents: number;
};

export type StoreImportRequest = {
  limit?: number;
  since?: string;
};

export type StoreImportResult = {
  fetchedAt: string;
  orders: StoreAdapterOrder[];
  source: StoreAdapterSource;
};

export interface StoreAdapter {
  readonly source: StoreAdapterSource;
  importOrders(request?: StoreImportRequest): Promise<StoreImportResult>;
}
