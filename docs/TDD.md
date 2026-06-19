# TDD.md

## Testing Policy

The current app has a seeded Phase 2 Prisma-backed dashboard and orders workflow. Tests should protect pure domain calculations, DTO-independent helper behavior, dashboard/order browser flow, responsive usability, and local tooling without calling live external services.

Test data must be synthetic. Tests must not call live external APIs, paid APIs, Stripe, Shopify, WooCommerce, or real customer/order/payment systems.

## Current Coverage

| Layer | Location | Purpose |
|---|---|---|
| Unit/domain | `tests/unit/domain/kpis.test.ts` | Verifies KPI formulas, zero-revenue behavior, canceled-order exclusion, refund status handling, unfulfilled/delayed fulfillment counts, failed payments, and active dispute exposure |
| Unit/domain | `tests/unit/domain/dashboard.test.ts` | Verifies weekly revenue/refund chart grouping and exclusion of non-counted records |
| Unit/domain | `tests/unit/orders/orders.test.ts` | Verifies order search, combined filters, empty results, missing payment mapping, refund summary, and status label/tone helpers |
| Unit/domain | `tests/unit/refunds.test.ts` | Legacy coverage for retained static refund helper utilities |
| E2E/browser | `e2e/dashboard.spec.ts` | Starts or reuses the Next dev server and checks the dashboard overview, KPI/chart visibility, orders table, search/filter interaction, and order detail route |

## Required Gates

| Gate | Command | Pass condition |
|---|---|---|
| Lint | `pnpm lint` | No ESLint errors |
| Typecheck | `pnpm typecheck` | TypeScript exits successfully |
| Unit tests | `pnpm test` | Vitest exits successfully |
| Build | `pnpm build` | Next.js production build succeeds |
| E2E/browser tests | `pnpm e2e -- --project=chromium` | Playwright Chromium tests pass |

`pnpm validate` runs lint, typecheck, tests, and build. E2E is intentionally separate because it controls a browser and dev server.

## Future Test Expansion

Later phases should add focused tests for:

- CSV import validation and error handling
- Weekly CSV export generation
- Standalone refunds/disputes workflows
- Customer detail views and notes
- Alert rule evaluation
- Route-handler tests once APIs are introduced
- Repository integration tests if database read/write behavior becomes more complex

## Skipped Gate Policy

Any skipped applicable gate must be recorded in `docs/STATE.md` with the command, reason, risk, and next action.
