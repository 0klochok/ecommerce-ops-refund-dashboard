# TDD.md

## Testing Policy

The current app has a seeded Phase 4 Prisma-backed dashboard, orders workflow, refunds/disputes page, customer detail page, CSV import flow, weekly CSV export, alert recalculation workflow, and mock/test-only Stripe webhook handling. Tests should protect pure domain calculations, DTO-independent helper behavior, CSV validation/escaping, alert candidate evaluation, import pipeline behavior, webhook signature/idempotency behavior, browser flows, responsive usability, and local tooling without calling live external services.

Test data must be synthetic. Tests must not call live external APIs, paid APIs, Stripe, Shopify, WooCommerce, or real customer/order/payment systems.

## Current Coverage

| Layer | Location | Purpose |
|---|---|---|
| Unit/domain | `tests/unit/domain/kpis.test.ts` | Verifies KPI formulas, zero-revenue behavior, canceled-order exclusion, refund status handling, unfulfilled/delayed fulfillment counts, failed payments, and active dispute exposure |
| Unit/domain | `tests/unit/domain/dashboard.test.ts` | Verifies weekly revenue/refund chart grouping and exclusion of non-counted records |
| Unit/domain | `tests/unit/orders/orders.test.ts` | Verifies order search, combined filters, empty results, missing payment mapping, refund summary, and status label/tone helpers |
| Unit/domain | `tests/unit/refunds.test.ts` | Legacy coverage for retained static refund helper utilities |
| Unit/CSV | `tests/unit/csv/orders-import.test.ts` | Verifies valid and invalid order import fixtures, row-level errors, and impossible calendar-date rejection |
| Unit/CSV | `tests/unit/csv/weekly-ops-report.test.ts` | Verifies weekly operations CSV escaping for commas, quotes, and newlines, plus strict `weekStart` calendar-date validation |
| Unit/alerts | `tests/unit/alerts/alerts.test.ts` | Verifies delayed fulfillment, high refund, repeated failed payment, and alert dedupe logic |
| Integration-style | `tests/integration/imports/order-import-service.test.ts` | Verifies the CSV import service with a fake repository and fixture data |
| Integration-style | `tests/integration/alerts/alert-evaluation-service.test.ts` | Verifies alert evaluation with a fake repository and existing-alert skip behavior |
| Unit/Stripe | `tests/unit/stripe/event-mapping.test.ts` | Verifies mock Stripe refund, failed-payment, dispute, and unsupported event mapping without live Stripe calls |
| Integration-style webhooks | `tests/integration/webhooks/stripe-webhook-service.test.ts` | Verifies signed webhook handling, invalid/missing signature or secret handling, malformed body rejection, duplicate delivery idempotency, and safe unsupported-event storage with a fake repository |
| E2E/browser | `e2e/dashboard.spec.ts` | Starts or reuses the Next dev server and checks the dashboard overview, KPI/chart visibility, orders table, search/filter interaction, and order detail route |
| E2E/browser | `e2e/operations.spec.ts` | Verifies imports upload, imported order visibility, alert recalculation, and weekly CSV download |

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

Later phases should add focused tests for auth and permission boundaries if auth is introduced, and repository-backed webhook integration if the webhook persistence layer becomes more complex. Real Stripe CLI/manual webhook behavior remains optional and requires explicit approval.

## Skipped Gate Policy

Any skipped applicable gate must be recorded in `docs/STATE.md` with the command, reason, risk, and next action.
