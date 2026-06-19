# CONTEXT.md

## Current State

- Last updated: 2026-06-18
- Phase: Phase 2.6 - portfolio documentation prep
- Status: Phase 2 mock-only refund operations dashboard implemented; Phase 2.6 is documentation and durable demo/QA artifact prep only
- Repository root: `C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard`
- GitHub remote: configured as `origin`; Codex must not commit, push, tag, rewrite history, stage files, or alter remotes without explicit approval for that exact action.

## System Overview

This is a local-first portfolio dashboard for e-commerce operations and refund workflows. The current runtime is a client-side dashboard using typed synthetic refund data only. It demonstrates refund KPI review, queue search/filter/sort, selected refund details, and responsive operations-table behavior.

Current and planned runtime surfaces:

- Frontend/UI: Next.js App Router under `src/app`, with the current dashboard route in `src/app/(dashboard)`.
- Mock data/domain helpers: typed synthetic refund data and pure table helpers in `src/lib/mock-data/refunds.ts`.
- Backend/API: future Next.js Route Handlers; no current API routes are implemented.
- Database: PostgreSQL through Docker Compose and Prisma are scaffolded for later phases; the current dashboard does not require database access.
- Integrations: mock-first adapters are planned; Stripe test webhooks require explicit approval before use.

## Stack

| Area | Choice |
|---|---|
| Runtime | Node.js, observed locally as `v24.16.0` |
| Package manager | pnpm `11.7.0`, pinned through `packageManager` |
| Frontend | Next.js App Router, React, TypeScript |
| Styling/UI | Tailwind CSS v4, shadcn/ui Radix Nova preset, Lucide icons |
| Database | Local PostgreSQL via Docker Compose, reserved for later persistence work |
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
| `src/lib/utils.ts` | shadcn utility helper |
| `tests/unit` | Vitest unit/component tests for the dashboard and mock-data helpers |
| `e2e` | Playwright browser tests for the main dashboard flow and responsive behavior |
| `prisma/schema.prisma` | Prisma PostgreSQL schema shell; no business models yet |
| `prisma.config.ts` | Prisma 7 config loading `DATABASE_URL` |
| `docker-compose.yml` | Local PostgreSQL service with safe local credentials |
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
| Local database | `docker compose up -d` |

## Safety Rules

- Use pnpm only; do not use npm, yarn, or bun as the project package manager.
- Keep `.env.local` and real secrets untracked.
- Use mock/no-paid-API defaults.
- Do not use real Stripe, Shopify, WooCommerce, customer, order, payment, or refund data.
- Do not add GitHub Actions until a later polish/CI phase after local validation is stable.
- Codex must not run `git add`, `git commit`, `git push`, tags, history rewrites, destructive checkouts, or remote changes.

## Open Limits

- The dashboard remains client-side and mock-data only.
- Prisma has only a datasource/generator shell; business schema design starts in a later approved phase.
- No backend API routes, seed scripts, auth, CSV workflows, alert rules, Stripe handlers, or real adapters exist yet.
- `docs/REQ.md` is still a requirements template, and `docs/DESIGN.md` contains a design-reference artifact rather than a current app architecture spec.
