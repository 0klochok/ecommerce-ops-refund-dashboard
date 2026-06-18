# RUNBOOK.md

## Phase 0 Operations

Run all commands from:

```powershell
Set-Location -LiteralPath "C:\Users\alex\Documents\Coding Projects\Portfolio Projects\ecommerce-ops-refund-dashboard"
```

## Prerequisites

| Tool | Observed version | Check |
|---|---:|---|
| Node.js | `v24.16.0` | `node --version` |
| pnpm | `11.7.0` | `pnpm --version` |
| Git | `2.54.0.windows.1` | `git --version` |
| Docker | `29.5.3` | `docker --version` |
| Docker Compose | `v5.1.4` | `docker compose version` |

## Install

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env.local
```

`.env.local` is local-only and must remain untracked.

## Start App

```powershell
pnpm dev
```

Open `http://localhost:3000`.

## Start Local PostgreSQL

```powershell
docker compose up -d
docker compose ps
```

The local database uses safe development credentials from `docker-compose.yml` and `.env.example`.

## Quality Gates

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
pnpm validate
```

`pnpm validate` runs lint, typecheck, tests, and build. Run `pnpm e2e` separately when browser validation is needed.

## Logs

```powershell
docker compose logs --tail=100
```

For the app, inspect the terminal running `pnpm dev`.

## Safe Stop

```powershell
# Stop the dev server with Ctrl+C.
docker compose down
```

Do not run destructive resets such as `docker compose down -v`, `git reset`, or `git clean` unless explicitly approved.

## Git Safety

Read-only inspection is allowed:

```powershell
git status --short
git diff -- .
git remote -v
```

Codex must not commit, push, tag, rewrite history, alter remotes, or stage files unless the user explicitly approves that exact action.
