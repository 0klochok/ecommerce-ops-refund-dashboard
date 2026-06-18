# CONTEXT.md

## Current State

- Last updated: 2026-06-18
- Phase: Phase 0 - repository foundation
- Status: Phase 0 implemented
- Repository root: `C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard`
- GitHub remote: configured as `origin`; Codex must not commit, push, tag, rewrite history, or alter remotes.

## System Overview

This is a local-first portfolio dashboard for e-commerce operations and refund workflows. Phase 0 is scaffold/tooling/guardrails only. No dashboard business features, real external API calls, real payment data, or real customer/order data are in scope for this phase.

Future runtime surfaces:

- Frontend/UI: Next.js App Router under `src/app`.
- Backend/API: future Next.js Route Handlers.
- Database: PostgreSQL through Docker Compose, accessed through Prisma.
- Integrations: mock-first adapters; Stripe test webhooks only after explicit approval.

## Stack

| Area | Choice |
|---|---|
| Runtime | Node.js, observed locally as `v24.16.0` |
| Package manager | pnpm `11.7.0`, pinned through `packageManager` |
| Frontend | Next.js App Router, React, TypeScript |
| Styling/UI | Tailwind CSS v4, shadcn/ui Radix Nova preset, Lucide icons |
| Database | Local PostgreSQL via Docker Compose |
| ORM | Prisma 7 |
| Unit/smoke tests | Vitest, Testing Library, jsdom |
| E2E | Playwright Chromium |
| CI/CD | Not configured in Phase 0 |

## Repository Map

| Path | Purpose |
|---|---|
| `src/app` | Next.js App Router root layout and global styles |
| `src/app/(dashboard)` | Minimal Phase 0 dashboard route scaffold |
| `src/app/api` | Future Route Handler boundary |
| `src/components/ui` | Future shadcn/ui components |
| `src/lib/utils.ts` | shadcn utility helper |
| `tests/unit` | Vitest unit/smoke tests |
| `tests/integration` | Future integration tests |
| `e2e` | Playwright browser smoke tests |
| `prisma/schema.prisma` | Prisma PostgreSQL schema shell; no business models yet |
| `prisma/migrations` | Future Prisma migrations |
| `prisma.config.ts` | Prisma 7 config loading `DATABASE_URL` |
| `docker-compose.yml` | Local PostgreSQL service with safe local credentials |
| `.env.example` | Safe local placeholders only |
| `components.json` | shadcn/ui configuration |

## Commands

| Purpose | Command |
|---|---|
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Unit/smoke tests | `pnpm test` |
| Build | `pnpm build` |
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

- Prisma has only a datasource/generator shell; business schema design starts in a later phase.
- The home page is a scaffold smoke target, not a dashboard.
- No seed data, adapters, CSV workflows, alerts, or Stripe handlers exist yet.
