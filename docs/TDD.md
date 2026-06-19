# TDD.md

## Testing Policy

The current app is a mock-only Phase 2 refund operations dashboard. Tests should protect the implemented dashboard behavior, responsive containment, accessibility-relevant interactions, and local tooling without calling live external services.

Test data must be synthetic. Tests must not call live external APIs, paid APIs, Stripe, Shopify, WooCommerce, or real customer/order/payment systems.

## Current Coverage

| Layer | Location | Purpose |
|---|---|---|
| Unit/component | `tests/unit/page.test.tsx` | Verifies the dashboard renders KPI content, refund queue controls, selected-detail behavior, accessibility labels, and focus recovery |
| Unit/domain | `tests/unit/refunds.test.ts` | Verifies mock refund metrics, urgent/high-risk classification, search, filters, sorting, and empty results |
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

- Order KPI calculations and order-table pagination
- CSV import validation and error handling
- Refund/dispute workflows beyond the current static detail panel
- Customer detail views and notes
- Alert rule evaluation
- Weekly CSV export generation
- Mock adapter contracts for Stripe/store data
- Prisma-backed persistence once business models are introduced

## Skipped Gate Policy

Any skipped applicable gate must be recorded in `docs/STATE.md` with the command, reason, risk, and next action.
