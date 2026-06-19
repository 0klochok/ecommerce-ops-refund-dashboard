# E-commerce Ops Refund Dashboard

Portfolio-grade internal operations dashboard for a small e-commerce store. The current repo has a seeded local PostgreSQL/Prisma data foundation plus an existing mock-only refund operations surface for portfolio/client review, screenshots, and local QA without real commerce or payment data.

## What It Solves

Small e-commerce teams often need a quick way to review refund workload, identify urgent or high-risk cases, and prepare operations updates without stitching together exports from payments, support, and store tools. This project demonstrates that workflow with synthetic refund records and a local-first Next.js dashboard.

## Current Implemented Scope

- Prisma data model for customers, orders, order items, payments, refunds, disputes, fulfillment events, alert rules, alerts, customer notes, import batches, and webhook events.
- Deterministic fake seed data for a credible operations dataset.
- Mock Stripe-style webhook fixtures and mock-first store adapter contracts.
- Pure KPI/domain calculations for future dashboard cards.
- KPI summary cards for total refunded, open refunds, urgent/high-risk refunds, and average refund amount.
- Interactive refund operations queue with search across refund id, order id, and customer label.
- Status, channel, and urgent/high-risk filters.
- Amount and created-date sorting.
- Empty state with clear-filters recovery.
- Selected refund detail panel that opens only after row selection, can be closed, returns focus, and stays responsive at desktop, 900px, and mobile widths.
- Automated Vitest and Playwright coverage for the domain calculations, main dashboard flow, and responsive containment.

The existing UI is still intentionally backed by static mock data. Later phases can connect the UI to the Prisma-backed data layer and add order/customer pages, CSV import/export, alert evaluation workflows, and route handlers.

## Data And Integration Safety

- All visible data is synthetic demo data.
- Seeded database data is deterministic and fake.
- Do not use real Stripe, Shopify, WooCommerce, customer, order, payment, or refund data.
- External integrations default to mock/no-paid-API mode.
- Stripe test webhooks require explicit approval before use.
- `.env.local` stays untracked. `.env.example` contains safe placeholders only.
- No paid APIs are required for local development or validation.

## Tech Stack

- Next.js App Router with TypeScript
- React 19
- Tailwind CSS v4
- shadcn/ui using the Radix Nova preset and Lucide icons
- Next.js Route Handlers reserved for future backend endpoints
- Prisma 7 with local PostgreSQL through Docker Compose
- Vitest, Testing Library, and jsdom for unit/component tests
- Playwright Chromium for browser/E2E tests
- pnpm as the only project package manager

## Setup

Run commands from the project root:

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard"
corepack enable
pnpm install
Copy-Item .env.example .env.local
```

The current dashboard does not require the local PostgreSQL container to render because the visible UI still uses static mock data. Keep `.env.local` local-only and do not commit real secrets.

## Database, Migrations, And Seed Data

The local database service is named `db` and maps container port `5432` to host port `5433` to avoid common local Postgres conflicts.

```powershell
docker compose up -d db
docker compose ps
pnpm prisma migrate dev --name phase_1_data_model
pnpm db:generate
pnpm db:seed
pnpm db:studio
```

The Phase 1 seed uses fixed reference date `2026-06-15T12:00:00.000Z` and a fixed pseudo-random seed. It creates 85 customers, 180 orders, 420 order items, 174 payments, 37 refunds, 7 disputes, 244 fulfillment events, 3 alert rules, 33 alerts, 30 customer notes, 3 import batches, and 219 webhook events.

Useful database scripts:

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
pnpm db:reset
```

## KPI Formulas

- Gross revenue cents: paid non-canceled order total.
- Order count: paid non-canceled orders.
- Refund amount cents: succeeded/completed refund amount only.
- Refund rate: refund amount divided by gross revenue; zero when gross revenue is zero.
- Average order value cents: gross revenue divided by paid non-canceled order count.
- Unfulfilled orders: physical orders that are not fulfilled and not canceled.
- Delayed fulfillment: unfulfilled physical orders older than the configured delay threshold.
- Failed payment count: failed payments.
- Disputed amount cents: active dispute exposure; closed, won, and lost disputes are excluded.

## Mock Integrations

Mock Stripe-style event fixtures live under `src/lib/test-data/stripe-events/` and contain fake `evt_mock_`, `pi_mock_`, `re_mock_`, and `dp_mock_` identifiers only. The mock store adapter under `src/lib/store-adapters/` defines the contract future Shopify, WooCommerce, Stripe-only, or CSV adapters can implement without adding real network calls or credentials in this phase.

## Run Development Mode

```powershell
pnpm dev
```

Open `http://localhost:3000`.

## Build

```powershell
pnpm build
```

## Run Production Preview

Build first, then start the Next.js production server:

```powershell
pnpm build
pnpm exec next start -p 3000 -H 127.0.0.1
```

Open `http://127.0.0.1:3000`. Stop the server with `Ctrl+C`.

Use production preview for portfolio screenshots so the Next.js dev indicator is not visible.

## Tests And Validation

Run individual gates:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

Run the aggregate non-browser gate:

```powershell
pnpm validate
```

`pnpm validate` runs lint, typecheck, unit/component tests, and build. `pnpm e2e` is separate because Playwright starts or reuses a local dev server and controls Chromium.

## Manual QA And Screenshots

- Manual QA checklist: `docs/RUNBOOK.md`
- Screenshot naming convention: `docs/assets/screenshots/README.md`
- Phase history and validation record: `docs/STATE.md`

## Adapting The Concept

- Shopify store: map Shopify orders, fulfillments, returns, and customer tags into the same operations queue shape.
- WooCommerce store: map WooCommerce order/refund status, payment gateway metadata, and fulfillment plugins into the queue and KPI layer.
- Stripe-only business: use Stripe payment intents, charges, refunds, disputes, and webhook events as the primary source, with store/customer context added only when available.

All variants should keep the same safety rule for this repository: synthetic data by default, mock adapters first, and no real production customer or payment records.
