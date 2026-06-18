# E-commerce Ops Refund Dashboard

Portfolio-grade internal operations dashboard for a small e-commerce store.

Current status: Phase 0 repository foundation only. The app is a minimal Next.js scaffold with tooling, local database configuration, tests, and safety guardrails. Dashboard business features are intentionally not implemented yet.

## Data And Integration Safety

- All future demo data must be synthetic test/demo data.
- Do not use real Stripe, Shopify, WooCommerce, customer, order, payment, or refund data.
- External integrations default to mock/no-paid-API mode.
- Stripe test webhooks require explicit approval before use.
- `.env.local` stays untracked. `.env.example` contains safe placeholders only.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS v4
- shadcn/ui using the Radix Nova preset and Lucide icons
- Next.js Route Handlers for future backend endpoints
- Prisma ORM with local PostgreSQL through Docker Compose
- Vitest and Testing Library for unit/smoke tests
- Playwright for browser smoke/E2E tests
- pnpm as the only project package manager

## Setup

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard"
corepack enable
pnpm install
Copy-Item .env.example .env.local
```

The placeholder `.env.local` is for local development only and must not be committed.

## Local Development

```powershell
pnpm dev
```

Open `http://localhost:3000`.

Optional local PostgreSQL:

```powershell
docker compose up -d
docker compose ps
```

## Validation

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm validate
```

`pnpm validate` runs lint, typecheck, unit tests, and build. E2E remains a separate command because it starts a dev server through Playwright.

## Portfolio Direction

Later phases will add KPI cards, order/refund/customer views, CSV import/export, alert rules, seeded fake data, and mock-first adapters. The design should explain how the same adapter boundary could support Shopify, WooCommerce, or Stripe-only businesses without using real production data in this repo.
