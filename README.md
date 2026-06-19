# E-commerce Ops Refund Dashboard

Portfolio-grade internal operations dashboard for a small e-commerce store. The app uses a local PostgreSQL database, Prisma, deterministic fake seed data, and mock-only provider records to demonstrate order, payment, refund, dispute, and fulfillment operations without using real commerce or payment data.

## What It Solves

Small e-commerce teams need a quick way to understand revenue, refund exposure, fulfillment backlog, payment failures, and order-level context without stitching together exports from store, payment, and support tools. This project demonstrates that workflow with synthetic data only.

## Current Implemented Scope

- Prisma data model for customers, orders, order items, payments, refunds, disputes, fulfillment events, alert rules, alerts, customer notes, import batches, and webhook events.
- Deterministic fake seed data for a credible operations dataset.
- Mock Stripe-style webhook fixtures and mock-first store adapter contracts.
- Pure KPI/domain calculations for revenue, order count, refund amount, refund rate, average order value, unfulfilled orders, delayed fulfillment, failed payments, and active dispute exposure.
- Prisma-backed dashboard overview at `/` with KPI cards and a weekly revenue/refund chart.
- Prisma-backed orders workflow at `/orders` with client-side search, filters, sorting, pagination, status badges, and detail links.
- Order detail route at `/orders/[orderId]` with order, customer, line item, payment, refund, dispute, and fulfillment context.
- Automated Vitest coverage for domain calculations and order helpers.
- Playwright Chromium smoke coverage for the main dashboard and orders flow.

Phase 2 intentionally does not implement CSV import/export UI, standalone refunds/disputes pages, customer detail pages, alert management pages, Stripe webhook handling, auth, GitHub Actions, or real store/payment adapters.

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
- Recharts for the overview chart
- TanStack Table for the orders table
- Next.js Route Handlers reserved for future backend endpoints
- Prisma 7 with local PostgreSQL through Docker Compose
- Vitest, Testing Library, and jsdom for unit tests
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

Keep `.env.local` local-only and do not commit real secrets.

## Database, Migrations, And Seed Data

The local database service is named `db` and maps container port `5432` to host port `5433`.

```powershell
docker compose up -d db
pnpm db:generate
pnpm db:seed
```

If seed fails because migrations have not been applied:

```powershell
pnpm db:migrate
pnpm db:seed
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

## Run The Dashboard Locally

Start the database and seed it first, then run:

```powershell
pnpm dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/orders`

## KPI Formulas

- Gross revenue: paid non-canceled order total.
- Order count: paid non-canceled orders.
- Refund amount: succeeded/completed refund amount only.
- Refund rate: refund amount divided by gross revenue; zero when gross revenue is zero.
- Average order value: gross revenue divided by paid non-canceled order count.
- Unfulfilled orders: physical orders that are not fulfilled and not canceled.
- Delayed fulfillment: unfulfilled physical orders older than the configured delay threshold.
- Failed payment count: failed payments.
- Disputed amount: active dispute exposure; closed, won, and lost disputes are excluded.

## Orders Workflow

The `/orders` route demonstrates an internal operations queue for reviewing order health across customer identity, source, fulfillment state, payment status, refund exposure, and order value. The detail route shows the context an operations user would need before escalating a delayed fulfillment, payment failure, refund, or dispute.

## Mock Integrations

Mock Stripe-style event fixtures live under `src/lib/test-data/stripe-events/` and contain fake `evt_mock_`, `pi_mock_`, `re_mock_`, and `dp_mock_` identifiers only. The mock store adapter under `src/lib/store-adapters/` defines the contract future Shopify, WooCommerce, Stripe-only, or CSV adapters can implement without adding real network calls or credentials.

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
pnpm e2e -- --project=chromium
```

Run the aggregate non-browser gate:

```powershell
pnpm validate
```

`pnpm validate` runs lint, typecheck, unit tests, and build. E2E is separate because Playwright starts or reuses a local server and controls Chromium.

## Manual QA And Screenshots

- Manual QA checklist: `docs/RUNBOOK.md`
- Screenshot naming convention: `docs/assets/screenshots/README.md`
- Phase history and validation record: `docs/STATE.md`

## Adapting The Concept

- Shopify store: map Shopify orders, fulfillments, returns, and customer tags into the same operations queue shape.
- WooCommerce store: map WooCommerce order/refund status, payment gateway metadata, and fulfillment plugins into the queue and KPI layer.
- Stripe-only business: use Stripe payment intents, charges, refunds, disputes, and webhook events as the primary source, with store/customer context added only when available.

All variants should keep the same safety rule for this repository: synthetic data by default, mock adapters first, and no real production customer or payment records.
