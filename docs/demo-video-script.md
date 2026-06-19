# Demo Video Script

Target length: 2-4 minutes.

## Scene List

1. Open on the dashboard overview.
   - Talking point: a small e-commerce operator usually has revenue, orders, refunds, fulfillment, and payment events split across disconnected tools.
   - Emphasize that this app centralizes the operational view using demo/test data only.

2. Show KPI cards and the revenue/refund chart.
   - Talking point: the dashboard answers the daily questions first: how much revenue came in, how many orders need attention, and how much refund exposure exists.

3. Open the orders queue and apply filters/search.
   - Talking point: operators can isolate failed payments, delayed fulfillment, refund-heavy orders, and customer context without manually stitching CSV exports together.

4. Open an order detail page.
   - Talking point: the detail view brings line items, payment state, refunds, disputes, fulfillment events, and customer information into one review screen.

5. Show refunds/disputes and a customer detail page.
   - Talking point: refund and dispute work is tied back to the customer and order history, which helps an operator decide whether to replace, refund, escalate, or monitor.

6. Show CSV import.
   - Talking point: CSV import keeps the workflow useful for stores that are not fully integrated yet. Imported demo orders update the same operations data model.

7. Show alerts and weekly CSV export.
   - Talking point: alerts catch delayed fulfillment, high refund amounts, and repeated failed payments; the weekly export turns the same data into an operations report.

8. Mention Stripe webhook support.
   - Talking point: mock/test Stripe webhook handling demonstrates integration readiness. Signed test events are verified locally, stored idempotently, and mapped into refunds, failed payments, or disputes when they match local mock records.

9. Close on the safety disclaimer.
   - Talking point: all data is synthetic demo/test data. The project does not use real Stripe, Shopify, WooCommerce, customer, order, payment, or refund data and does not make production payment calls.

## Suggested Narrative

"This portfolio project is an internal operations dashboard for a small e-commerce store. The operator starts with disconnected tools: a storefront, payment events, refunds, fulfillment status, support notes, and spreadsheet reports. The dashboard pulls those concerns into one local-first workflow.

The overview starts with business health: revenue, orders, refunds, refund rate, average order value, and unfulfilled orders. The orders queue is where the operator investigates, with search, filters, sorting, pagination, and detail views for payments, refunds, disputes, fulfillment, and customer context.

For stores that still rely on exports, the CSV import flow adds demo order data into the same model. Alerts highlight delayed fulfillment, high refund amounts, and repeated failed payments. The weekly CSV export packages the operational picture for reporting.

Phase 4 adds mock/test Stripe webhook support. Signed test events are verified locally, stored once by provider event ID, and mapped into refund, failed-payment, or dispute records when they match the local demo data. This shows how a real integration would fit without using production credentials or real customer data."

