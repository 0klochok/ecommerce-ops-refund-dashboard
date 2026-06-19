# TDD.md

## Testing Policy

The current app has a seeded Phase 1 data foundation and an existing mock-only refund operations dashboard. Tests should protect the implemented domain calculations, dashboard behavior, responsive containment, accessibility-relevant interactions, and local tooling without calling live external services.

Test data must be synthetic. Tests must not call live external APIs, paid APIs, Stripe, Shopify, WooCommerce, or real customer/order/payment systems.

## Current Coverage

| Layer | Location | Purpose |
|---|---|---|
| Unit/component | `tests/unit/page.test.tsx` | Verifies the dashboard renders KPI content, refund queue controls, selected-detail behavior, accessibility labels, and focus recovery |
| Unit/domain | `tests/unit/refunds.test.ts` | Verifies mock refund metrics, urgent/high-risk classification, search, filters, sorting, and empty results |
| Unit/domain | `tests/unit/domain/kpis.test.ts` | Verifies Phase 1 KPI formulas, zero-revenue behavior, canceled-order exclusion, refund status handling, unfulfilled/delayed fulfillment counts, failed payments, and active dispute exposure |
| E2E/browser | `e2e/home.spec.ts` | Starts or reuses the Next dev server and checks the main dashboard flow, detail-panel behavior, responsive containment, and no page-level horizontal overflow in Chromium |

## Required Gates

| Gate | Command | Pass condition |
|---|---|---|
| Lint | `pnpm lint` | No ESLint errors |
| Typecheck | `pnpm typecheck` | TypeScript exits successfully |
| Unit/component tests | `pnpm test` | Vitest exits successfully |
| Build | `pnpm build` | Next.js production build succeeds |
| E2E/browser tests | `pnpm e2e` | Playwright Chromium tests pass |

`pnpm validate` runs lint, typecheck, tests, and build. E2E is intentionally separate because it controls a browser and dev server.

## Future Test Expansion

Later phases should add focused tests for:

- Order-table pagination
- CSV import validation and error handling
- Refund/dispute workflows beyond the current static detail panel
- Customer detail views and notes
- Alert rule evaluation
- Weekly CSV export generation
- Route-handler and repository tests once the UI/API starts reading Prisma-backed data

## Skipped Gate Policy

Any skipped applicable gate must be recorded in `docs/STATE.md` with the command, reason, risk, and next action.
