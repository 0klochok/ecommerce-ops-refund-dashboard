# RUNBOOK.md

## Operations And QA

Run all commands from:

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard"
```

## Install

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env.local
```

`.env.local` is local-only and must remain untracked.

## Start Local PostgreSQL

```powershell
docker compose up -d db
docker compose ps
```

The local database uses safe development credentials from `docker-compose.yml` and `.env.example`. It maps container port `5432` to host port `5433`.

## Migrate, Generate, And Seed

```powershell
pnpm db:generate
pnpm db:seed
```

If migrations are not applied yet:

```powershell
pnpm db:migrate
pnpm db:seed
```

The seed is deterministic, uses fixed reference date `2026-06-15T12:00:00.000Z`, and contains fake demo records only.

## Start Development App

```powershell
pnpm dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/orders`

## Production Preview

```powershell
pnpm build
pnpm exec next start -p 3000 -H 127.0.0.1
```

Open `http://127.0.0.1:3000`. Stop the server with `Ctrl+C`.

Use production preview for portfolio screenshots so the Next.js dev indicator does not appear.

## Quality Gates

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e -- --project=chromium
pnpm validate
```

`pnpm validate` runs lint, typecheck, tests, and build. Run E2E separately when browser validation is needed.

## Manual QA Checklist

Use synthetic demo data only. Do not enter or capture real customer, order, payment, refund, Stripe, Shopify, or WooCommerce data.

- [ ] Start database: `docker compose up -d db`.
- [ ] Generate and seed: `pnpm db:generate`, then `pnpm db:seed`.
- [ ] Dev smoke: run `pnpm dev`, open `http://localhost:3000`, and confirm the dashboard loads without a runtime or build error overlay.
- [ ] KPI review: confirm gross revenue, order count, refund amount, refund rate, average order value, and unfulfilled orders render with plausible demo values.
- [ ] Chart review: confirm the revenue/refund chart renders.
- [ ] Orders navigation: open `http://localhost:3000/orders` or use the Orders nav link.
- [ ] Orders table: confirm order number, customer, order date, total, status, fulfillment, payment, refund, source, and action columns render.
- [ ] Search: search for `ORD-DEMO-00017` and confirm the table narrows to that demo order.
- [ ] Filters: apply the Failed payment filter and confirm matching rows remain visible.
- [ ] Sorting: sort by order date and total and confirm row order changes.
- [ ] Pagination: use Previous/Next where available and confirm page state changes.
- [ ] Detail route: open a row detail and confirm order summary, customer summary, line items, payment/refund/dispute records, and fulfillment events render where available.
- [ ] Not found: open an invalid `/orders/not-a-real-order` URL and confirm the route-specific not-found state links back to orders.
- [ ] Production preview smoke: run `pnpm build`, then `pnpm exec next start -p 3000 -H 127.0.0.1`, and confirm `/` and `/orders` load without the Next.js dev indicator.
- [ ] Screenshot readiness: capture only from production preview and save final images under `docs/assets/screenshots/` using the convention documented there.

## Logs

```powershell
docker compose logs --tail=100
```

For the app, inspect the terminal running `pnpm dev` or `pnpm exec next start -p 3000 -H 127.0.0.1`.

## Safe Stop

```powershell
# Stop the dev or production-preview server with Ctrl+C.
docker compose down
```

Do not run destructive resets such as `docker compose down -v`, `git reset`, or `git clean` unless explicitly approved.

## Git Safety

Read-only inspection is allowed:

```powershell
git status --short
git diff -- .
git remote -v
```

Codex must not commit, push, tag, rewrite history, alter remotes, or stage files unless the user explicitly approves that exact action.
