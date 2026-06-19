# CONTEXT.md

## Current State

- Last updated: 2026-06-19
- Phase: Phase 1 data foundation
- Status: Prisma/PostgreSQL data model, deterministic seed data, mock integration fixtures, mock store adapter contracts, and pure KPI/domain calculations are implemented. The visible dashboard UI still uses the existing static mock refund data until a later connection phase.
- Repository root: `C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard`
- GitHub remote: configured as `origin`; Codex must not commit, push, tag, rewrite history, stage files, or alter remotes without explicit approval for that exact action.

## System Overview

This is a local-first portfolio dashboard for e-commerce operations and refund workflows. The current runtime is a client-side dashboard using typed synthetic refund data only. It demonstrates refund KPI review, queue search/filter/sort, selected refund details, and responsive operations-table behavior.

Current and planned runtime surfaces:

- Frontend/UI: Next.js App Router under `src/app`, with the current dashboard route in `src/app/(dashboard)`.
- Mock data/domain helpers: typed synthetic refund data and pure table helpers in `src/lib/mock-data/refunds.ts`; Phase 1 KPI calculations in `src/lib/domain/kpis.ts`.
- Backend/API: future Next.js Route Handlers; no current API routes are implemented.
- Database: PostgreSQL through Docker Compose and Prisma 7 with seeded demo data; the current dashboard does not require database access to render.
- Integrations: mock-first store adapter contracts and mock Stripe-style fixtures exist; Stripe test webhooks require explicit approval before use.

## Stack

| Area | Choice |
|---|---|
| Runtime | Node.js, observed locally as `v24.16.0` |
| Package manager | pnpm `11.7.0`, pinned through `packageManager` |
| Frontend | Next.js App Router, React, TypeScript |
| Styling/UI | Tailwind CSS v4, shadcn/ui Radix Nova preset, Lucide icons |
| Database | Local PostgreSQL via Docker Compose service `db`, host port `5433` |
| ORM | Prisma 7 |
| Unit/component tests | Vitest, Testing Library, jsdom |
| E2E | Playwright Chromium |
| CI/CD | Not configured |

## Repository Map

| Path | Purpose |
|---|---|
| `src/app` | Next.js App Router root layout and global styles |
| `src/app/(dashboard)` | Current refund operations dashboard route and client-side queue component |
| `src/lib/mock-data/refunds.ts` | Synthetic refund records, metric helpers, formatting helpers, and table query helpers |
| `src/lib/domain/kpis.ts` | Pure KPI/domain calculations for future dashboard cards |
| `src/lib/db/prisma.ts` | Cached Prisma client helper for local Next.js development |
| `src/lib/store-adapters` | Mock-first store adapter contract and deterministic mock adapter |
| `src/lib/test-data/stripe-events` | Mock Stripe-style event fixtures for future webhook tests |
| `src/lib/utils.ts` | shadcn utility helper |
| `tests/unit` | Vitest unit/component tests for the dashboard and mock-data helpers |
| `e2e` | Playwright browser tests for the main dashboard flow and responsive behavior |
| `prisma/schema.prisma` | Prisma PostgreSQL business schema for demo operations data |
| `prisma/seed.ts` | Deterministic fake seed data using fixed reference date `2026-06-15T12:00:00.000Z` |
| `prisma.config.ts` | Prisma 7 config loading `.env.local` when present, then `.env.example` |
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
| Unit/component tests | `pnpm test` |
| E2E | `pnpm e2e` |
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

- The dashboard remains client-side and static mock-data only; it is not yet connected to Prisma.
- No backend API routes, CSV workflows, alert evaluation service, Stripe handlers, auth, or real adapters exist yet.
- `docs/REQ.md` is still a requirements template, and `docs/DESIGN.md` contains a design-reference artifact rather than a current app architecture spec.
