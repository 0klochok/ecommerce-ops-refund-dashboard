# Screenshot Asset Convention

This folder stores durable portfolio/demo screenshots captured from local
production preview with seeded synthetic data only.

Capture screenshots from production preview, not `pnpm dev`, so the Next.js dev indicator does not appear:

```powershell
pnpm build
pnpm exec next start -p 3000 -H 127.0.0.1
```

Open `http://127.0.0.1:3000`, capture the needed views, then stop the server with `Ctrl+C`.

## Naming

Use concise, stable `.png` filenames:

- `overview-dashboard.png` - dashboard overview with KPI cards and chart visible.
- `dashboard-kpi-cards.png` - focused KPI card summary.
- `revenue-refund-chart.png` - focused revenue/refund chart.
- `orders-table-filters.png` - orders queue with search and payment filter applied.
- `order-detail-page.png` - order detail context.
- `refunds-disputes-page.png` - refunds and disputes overview.
- `customer-detail-page.png` - customer detail context.
- `csv-import-success-state.png` - successful synthetic CSV import.
- `alerts-list.png` - alerts list after recalculation.
- `weekly-csv-export.png` - weekly operations CSV export evidence.
- `stripe-webhook-mock-test-evidence.png` - mock/test Stripe webhook test evidence.
- `readme-demo-data-disclaimer.png` - README safety disclaimer evidence.
- `mobile-orders-queue.png` - optional mobile-width sanity check for the orders queue.

Optional later screenshots should use lowercase kebab-case names, for example
`empty-order-results.png`.

## Quality Rules

- Use synthetic demo data only.
- Do not capture secrets, real customer data, production payments, browser bookmarks, terminal windows, or local file paths.
- Keep images reasonably sized for repository review.
- Replace outdated screenshots instead of accumulating near-duplicates.
