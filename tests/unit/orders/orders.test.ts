import { describe, expect, it } from "vitest";
import {
  defaultOrderTableFilters,
  fulfillmentStatusLabels,
  getFilteredOrderRows,
  getOrderStatusTone,
  getPrimaryPaymentStatus,
  getRefundStatusTone,
  getRefundSummary,
  orderStatusLabels,
  paymentStatusLabels,
  refundStatusLabels,
  sourceLabels,
  type OrderTableRow,
} from "@/lib/domain/orders";

const makeOrderRow = (
  overrides: Partial<OrderTableRow> = {},
): OrderTableRow => ({
  currency: "USD",
  customerEmail: "avery@example.test",
  customerName: "Avery Anderson",
  fulfillmentStatus: "FULFILLED",
  id: "order_test_1",
  orderNumber: "ORD-DEMO-00001",
  paymentStatus: "SUCCEEDED",
  placedAt: "2026-06-15T12:00:00.000Z",
  refundAmountCents: 0,
  refundStatus: "NONE",
  source: "MOCK_STORE",
  status: "PAID",
  totalCents: 10_000,
  ...overrides,
});

describe("order table helpers", () => {
  it("searches by order number, customer name, or email case-insensitively", () => {
    const rows = [
      makeOrderRow(),
      makeOrderRow({
        customerEmail: "casey@example.test",
        customerName: "Casey Carter",
        id: "order_test_2",
        orderNumber: "ORD-DEMO-00002",
      }),
    ];

    expect(
      getFilteredOrderRows(rows, {
        ...defaultOrderTableFilters,
        searchText: "00002",
      }),
    ).toHaveLength(1);
    expect(
      getFilteredOrderRows(rows, {
        ...defaultOrderTableFilters,
        searchText: "casey",
      })[0]?.id,
    ).toBe("order_test_2");
    expect(
      getFilteredOrderRows(rows, {
        ...defaultOrderTableFilters,
        searchText: "AVERY@EXAMPLE",
      })[0]?.id,
    ).toBe("order_test_1");
  });

  it("combines order, fulfillment, payment, and source filters", () => {
    const rows = [
      makeOrderRow({
        fulfillmentStatus: "DELAYED",
        paymentStatus: "PARTIALLY_REFUNDED",
        refundAmountCents: 2_000,
        refundStatus: "SUCCEEDED",
        source: "CSV_IMPORT",
        status: "PARTIALLY_REFUNDED",
      }),
      makeOrderRow({
        fulfillmentStatus: "DELAYED",
        id: "order_test_2",
        paymentStatus: "SUCCEEDED",
        source: "MOCK_STORE",
        status: "PAID",
      }),
    ];

    expect(
      getFilteredOrderRows(rows, {
        fulfillmentStatus: "DELAYED",
        orderStatus: "PARTIALLY_REFUNDED",
        paymentStatus: "PARTIALLY_REFUNDED",
        searchText: "",
        source: "CSV_IMPORT",
      }).map((row) => row.id),
    ).toEqual(["order_test_1"]);
  });

  it("returns an empty list when no rows match", () => {
    expect(
      getFilteredOrderRows([makeOrderRow()], {
        ...defaultOrderTableFilters,
        searchText: "missing-order",
      }),
    ).toEqual([]);
  });

  it("maps missing payment status from the order state", () => {
    expect(getPrimaryPaymentStatus([], "CANCELED")).toBe("CANCELED");
    expect(getPrimaryPaymentStatus([], "PENDING")).toBe("REQUIRES_PAYMENT");
    expect(getPrimaryPaymentStatus(["SUCCEEDED"], "PAID")).toBe("SUCCEEDED");
  });

  it("summarizes refund status and succeeded refund amount", () => {
    expect(getRefundSummary([])).toEqual({
      amountCents: 0,
      status: "NONE",
    });
    expect(
      getRefundSummary([
        {
          amountCents: 2_000,
          status: "SUCCEEDED",
        },
        {
          amountCents: 3_000,
          status: "FAILED",
        },
      ]),
    ).toEqual({
      amountCents: 2_000,
      status: "MIXED",
    });
  });

  it("keeps status labels and tones readable", () => {
    expect(orderStatusLabels.PAYMENT_FAILED).toBe("Payment failed");
    expect(fulfillmentStatusLabels.PARTIALLY_FULFILLED).toBe(
      "Partially fulfilled",
    );
    expect(paymentStatusLabels.REQUIRES_PAYMENT).toBe("Requires payment");
    expect(refundStatusLabels.NONE).toBe("No refund");
    expect(sourceLabels.CSV_IMPORT).toBe("CSV import");
    expect(getOrderStatusTone("PAYMENT_FAILED")).toBe("danger");
    expect(getRefundStatusTone("PROCESSING")).toBe("warning");
  });
});
