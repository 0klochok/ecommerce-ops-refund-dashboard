# CONTEXT.md

## Current State

- Last updated: 2026-06-19
- Phase: Phase 2 dashboard overview and orders workflow
- Status: Prisma/PostgreSQL data foundation, deterministic seed data, mock integration fixtures, KPI/domain calculations, Prisma-backed dashboard overview, orders table, and order detail route are implemented.
- Repository root: `C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard`
- GitHub remote: configured as `origin`; Codex must not commit, push, tag, rewrite history, stage files, or alter remotes without explicit approval for that exact action.

## System Overview

This is a local-first portfolio dashboard for e-commerce operations and refund workflows. The current runtime reads seeded synthetic data from local PostgreSQL through Prisma and renders a business overview plus an orders workflow.

Current runtime surfaces:

- Frontend/UI: Next.js App Router under `src/app`, with dashboard routes in `src/app/(dashboard)`.
- Dashboard overview: `/` renders KPI cards and a weekly revenue/refund Recharts visualization.
- Orders workflow: `/orders` renders a TanStack Table with client-side search, filters, sorting, pagination, status badges, and detail links.
- Order detail: `/orders/[orderId]` renders order, customer, line item, payment, refund, dispute, and fulfillment context.
- Domain helpers: pure KPI, formatting, chart grouping, order filtering, refund summary, and status label/tone helpers under `src/lib/domain`.
- Server data layer: Prisma reads under `src/server/repositories` and DTO mapping under `src/server/services`.
- Database: PostgreSQL through Docker Compose and Prisma 7 with deterministic demo seed data.
- Integrations: mock-first store adapter contracts and mock Stripe-style fixtures exist; Stripe test webhooks require explicit approval before use.

## Stack

| Area | Choice |
|---|---|
| Runtime | Node.js |
| Package manager | pnpm `11.7.0`, pinned through `packageManager` |
| Frontend | Next.js App Router, React, TypeScript |
| Styling/UI | Tailwind CSS v4, shadcn/ui Radix Nova preset, Lucide icons |
| Tables/charts | TanStack Table, Recharts |
| Database | Local PostgreSQL via Docker Compose service `db`, host port `5433` |
| ORM | Prisma 7 |
| Unit tests | Vitest and jsdom |
| E2E | Playwright Chromium |
| CI/CD | Not configured |

## Repository Map

| Path | Purpose |
|---|---|
| `src/app` | Next.js App Router root layout and global styles |
| `src/app/(dashboard)` | Dashboard layout, overview route, orders route, and order detail route |
| `src/components/dashboard` | KPI and chart components |
| `src/components/orders` | Orders table and status badge components |
| `src/components/ui` | shadcn/ui source components |
| `src/lib/domain` | Pure KPI, chart, order, and formatting helpers |
| `src/lib/db/prisma.ts` | Cached Prisma client helper for local Next.js development |
| `src/lib/mock-data/refunds.ts` | Legacy synthetic refund records and helper tests retained for now |
| `src/lib/store-adapters` | Mock-first store adapter contract and deterministic mock adapter |
| `src/lib/test-data/stripe-events` | Mock Stripe-style event fixtures for future webhook tests |
| `src/server/repositories` | Prisma read functions |
| `src/server/services` | Server DTO mapping and aggregation services |
| `tests/unit` | Vitest unit tests for domain helpers |
| `e2e` | Playwright browser test for dashboard and orders flow |
| `prisma/schema.prisma` | Prisma PostgreSQL business schema for demo operations data |
| `prisma/seed.ts` | Deterministic fake seed data using fixed reference date `2026-06-15T12:00:00.000Z` |
| `docker-compose.yml` | Local PostgreSQL service `db` with safe local credentials |
| `.env.example` | Safe local placeholders only |
| `components.json` | shadcn/ui configuration |
| `docs/assets/screenshots` | Durable naming convention for future portfolio screenshots |

## Commands

| Purpose | Command |
|---|---|
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Production preview | `pnpm exec next start -p 3000 -H 127.0.0.1` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| E2E | `pnpm e2e -- --project=chromium` |
| Quality gate | `pnpm validate` |
| Local database | `docker compose up -d db` |
| Prisma generate | `pnpm db:generate` |
| Prisma migrate | `pnpm db:migrate` |
| Prisma seed | `pnpm db:seed` |
| Prisma Studio | `pnpm db:studio` |

## Safety Rules

- Use pnpm only; do not use npm, yarn, or bun as the project package manager.
- Keep `.env.local` and real secrets untracked.
- Use mock/no-paid-API defaults.
- Do not use real Stripe, Shopify, WooCommerce, customer, order, payment, or refund data.
- Do not add GitHub Actions until a later polish/CI phase after local validation is stable.
- Codex must not run `git add`, `git commit`, `git push`, tags, history rewrites, destructive checkouts, or remote changes.

## Open Limits

- No CSV import/export UI.
- No standalone refunds/disputes page.
- No customer detail page or editable notes.
- No alert management page.
- No Stripe webhook endpoint or real provider calls.
- No auth or GitHub Actions.
- `docs/REQ.md` is still a requirements template, and `docs/DESIGN.md` contains a design-reference artifact rather than a current app architecture spec.
