# Screenshot Asset Convention

This folder is reserved for durable portfolio/demo screenshots. Phase 2.6 adds the convention only; no binary screenshots are committed in this pass.

Capture screenshots from production preview, not `pnpm dev`, so the Next.js dev indicator does not appear:

```powershell
pnpm build
pnpm exec next start -p 3000 -H 127.0.0.1
```

Open `http://127.0.0.1:3000`, capture the needed views, then stop the server with `Ctrl+C`.

## Naming

Use concise, stable `.png` filenames:

- `overview-dashboard.png` - default dashboard with KPI cards and queue visible.
- `refund-queue-table.png` - table-focused view showing search/filter/sort controls.
- `selected-refund-detail.png` - selected refund row with the detail panel open.
- `mobile-refund-queue.png` - mobile-width view showing contained table/detail behavior.

Optional later screenshots should use lowercase kebab-case names, for example `empty-refund-results.png`.

## Quality Rules

- Use synthetic demo data only.
- Do not capture secrets, real customer data, production payments, browser bookmarks, terminal windows, or local file paths.
- Keep images reasonably sized for repository review.
- Replace outdated screenshots instead of accumulating near-duplicates.
