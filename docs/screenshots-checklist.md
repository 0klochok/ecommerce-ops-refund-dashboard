# Screenshots Checklist

Use production preview for final screenshots so the Next.js dev indicator is not visible.

Suggested browser sizes:

- Desktop: `1440x1000`
- Optional mobile sanity check: `390x844`

## Portfolio Shot List

- [ ] Dashboard overview
- [ ] KPI cards
- [ ] Revenue/refund chart
- [ ] Orders table with filters
- [ ] Order detail page
- [ ] Refunds/disputes page
- [ ] Customer detail page
- [ ] CSV import success state
- [ ] Alerts list
- [ ] Weekly CSV export
- [ ] Stripe webhook/mock test evidence
- [ ] README/demo data disclaimer

## Capture Notes

- Use seeded synthetic data only.
- Do not enter, import, or capture real customer, order, payment, refund, Stripe, Shopify, or WooCommerce data.
- Prefer screenshots that show business context: refund exposure, fulfillment delays, failed payments, disputes, and export evidence.
- For webhook evidence, capture terminal output from `pnpm test` or a sanitized local API response that contains fake `evt_mock_*` identifiers only.

