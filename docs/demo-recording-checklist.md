# Demo Recording Checklist

Use this checklist to manually record the 2-4 minute production-preview portfolio demo. Do not record with real customer, order, payment, refund, Stripe, Shopify, WooCommerce, or private account data.

## 1. Restore The Seeded Baseline

Run from PowerShell:

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard"
docker compose up -d db
pnpm db:generate
pnpm db:seed
```

`pnpm db:seed` clears the local demo tables and restores the deterministic synthetic baseline.

## 2. Start Production Preview

Build first:

```powershell
pnpm build
```

Run production preview on `127.0.0.1:3000`:

```powershell
pnpm exec next start -p 3000 -H 127.0.0.1
```

Open `http://127.0.0.1:3000`. Stop the server with `Ctrl+C` after recording.

## 3. Browser Route Sequence

Use this sequence for the main 2-4 minute recording:

1. `http://127.0.0.1:3000/`
   - Show the overview, KPI cards, revenue/refund chart, and weekly CSV export button.
2. `http://127.0.0.1:3000/orders`
   - Search for `ORD-DEMO-00017`.
   - Apply the payment filter `Failed`.
   - Open the remaining row with the `View` link.
3. `/orders/<seeded-order-id>`
   - Show order summary, customer summary, line items, payments, refunds/disputes, and fulfillment events.
   - Use the customer link on this page.
4. `/customers/<seeded-customer-id>`
   - Show customer metrics, orders, refunds/disputes, and seeded notes.
   - Do not add a real note during recording.
5. `http://127.0.0.1:3000/refunds`
   - Show refund and dispute summary cards plus the refunds/disputes tables.
6. `http://127.0.0.1:3000/imports`
   - If showing a live import, upload `tests/fixtures/orders-import-sample.csv`.
   - Use only the synthetic fixture data.
   - Rerun `pnpm db:seed` before a retake if the import changes the local baseline.
7. `http://127.0.0.1:3000/alerts`
   - Click `Recalculate alerts` and mention delayed fulfillment, high refund amount, and repeated failed payment rules.
8. `http://127.0.0.1:3000/`
   - Click `Download weekly ops CSV`.
   - Close by stating that Stripe webhook handling is mock/test-only and no real Stripe or production API integration is used.

If a still image is easier for a quick cutaway, use the screenshots in `docs/assets/screenshots/`, especially `stripe-webhook-mock-test-evidence.png`, `weekly-csv-export.png`, and `readme-demo-data-disclaimer.png`.

## 4. Safety Checks Before Recording

- Use seeded/demo/mock data only.
- Do not show `.env` files, `.env.local`, terminals with secrets, private browser tabs, password managers, real accounts, real dashboards, or real provider consoles.
- Do not show Stripe CLI authenticated sessions or real Stripe, Shopify, WooCommerce, customer, order, payment, or refund data.
- Mention that no real Stripe/API integration is used; the app demonstrates local mock/test webhook handling and seeded synthetic operations data.
- Keep the browser focused on `http://127.0.0.1:3000` and avoid showing unrelated tabs or bookmarks.
- Use production preview, not `pnpm dev`, so the Next.js dev indicator is not visible.

## 5. Suggested Output

Suggested final filename:

```text
ecommerce-ops-refund-dashboard-production-preview-demo.mp4
```
