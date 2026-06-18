# TDD.md

## Testing Policy

Phase 0 validates scaffolding and tooling only. Tests should prove the app shell boots and renders a minimal smoke target. Business behavior tests start when dashboard features are implemented.

Test data must be synthetic. Tests must not call live external APIs, paid APIs, Stripe, Shopify, WooCommerce, or real customer/order/payment systems.

## Current Coverage

| Layer | Location | Purpose |
|---|---|---|
| Unit/smoke | `tests/unit/page.test.tsx` | Verifies the scaffold home page renders Phase 0 copy |
| E2E smoke | `e2e/home.spec.ts` | Starts the Next dev server and checks the scaffold page in Chromium |

## Required Gates

| Gate | Command | Pass condition |
|---|---|---|
| Lint | `pnpm lint` | No ESLint errors |
| Typecheck | `pnpm typecheck` | TypeScript exits successfully |
| Unit/smoke tests | `pnpm test` | Vitest exits successfully |
| Build | `pnpm build` | Next.js production build succeeds |
| E2E smoke | `pnpm e2e` | Playwright scaffold smoke test passes |

`pnpm validate` runs lint, typecheck, tests, and build. E2E is intentionally separate because it controls a browser and dev server.

## Future Test Expansion

Later phases should add focused tests for:

- Dashboard KPI calculations
- Order filtering, sorting, and pagination
- CSV import validation and error handling
- Refund/dispute workflows
- Customer detail views and notes
- Alert rule evaluation
- Weekly CSV export generation
- Mock adapter contracts for Stripe/store data

## Skipped Gate Policy

Any skipped applicable gate must be recorded in `docs/STATE.md` with the command, reason, risk, and next action.
