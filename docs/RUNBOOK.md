# RUNBOOK.md

## Operations And QA

Run all commands from:

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard"
```

## Prerequisites

| Tool | Observed version | Check |
|---|---:|---|
| Node.js | `v24.16.0` | `node --version` |
| pnpm | `11.7.0` | `pnpm --version` |
| Git | `2.54.0.windows.1` | `git --version` |
| Docker | `29.5.3` | `docker --version` |
| Docker Compose | `v5.1.4` | `docker compose version` |

## Install

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env.local
```

`.env.local` is local-only and must remain untracked.

## Start Development App

```powershell
pnpm dev
```

Open `http://localhost:3000`.

## Production Preview

```powershell
pnpm build
pnpm exec next start -p 3000 -H 127.0.0.1
```

Open `http://127.0.0.1:3000`. Stop the server with `Ctrl+C`.

Use production preview for portfolio screenshots so the Next.js dev indicator does not appear.

## Start Local PostgreSQL

```powershell
docker compose up -d db
docker compose ps
```

The local database uses safe development credentials from `docker-compose.yml` and `.env.example`. It maps container port `5432` to host port `5433`. The visible dashboard still uses static mock data and does not require the database to render.

## Migrate, Generate, And Seed

```powershell
pnpm prisma migrate dev --name phase_1_data_model
pnpm db:generate
pnpm db:seed
pnpm db:studio
```

The seed is deterministic, uses fixed reference date `2026-06-15T12:00:00.000Z`, and contains fake demo records only.

## Quality Gates

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm validate
```

`pnpm validate` runs lint, typecheck, tests, and build. Run `pnpm e2e` separately when browser validation is needed.

## Manual QA Checklist

Use synthetic demo data only. Do not enter or capture real customer, order, payment, refund, Stripe, Shopify, or WooCommerce data.

- [ ] Dev smoke: run `pnpm dev`, open `http://localhost:3000`, and confirm the refund operations dashboard loads without a runtime or build error overlay.
- [ ] Production preview smoke: run `pnpm build`, then `pnpm exec next start -p 3000 -H 127.0.0.1`, and confirm `http://127.0.0.1:3000` loads the same dashboard without the Next.js dev indicator.
- [ ] KPI review: confirm the cards for total refunded, open refunds, urgent/high-risk refunds, and average refund render with demo values.
- [ ] Queue review: confirm the interactive refund operations queue renders synthetic refund rows with status, channel, created date, priority, and SLA information.
- [ ] Search: search for `ord-1042` and confirm the table narrows to the matching demo order/customer row.
- [ ] Filters: apply pending-review status, Stripe test channel, and urgent/high-risk risk filtering; confirm the row counts and visible rows update.
- [ ] Sorting: switch amount and created-date sorting in both directions and confirm the first visible refund changes.
- [ ] Detail panel: select `rfnd_demo_1001`, confirm the selected refund detail panel opens, then close it with the X button and confirm focus returns to the selected row action.
- [ ] Empty state: search for `not-a-real-refund`, confirm the no-match empty state appears, then use clear filters to restore the queue without auto-opening a detail panel.
- [ ] Desktop layout: at about `1280x900`, confirm the detail panel opens beside the table, controls remain stable, and there is no page-level horizontal overflow.
- [ ] 900px layout: at `900x900`, confirm selecting a refund scrolls toward the detail panel and closing returns toward the selected row.
- [ ] Mobile layout: at about `390x900`, confirm controls remain usable, table scrolling is contained, detail content wraps, and there is no page-level horizontal overflow.
- [ ] Screenshot readiness: capture only from production preview and save final images under `docs/assets/screenshots/` using the convention documented there.
- [ ] Database seed check: run `pnpm db:studio` and confirm customers, orders, refunds, disputes, webhook events, alert rules, and alerts exist.

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
