# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm format       # Prettier

# Testing
pnpm test             # Jest unit tests
pnpm test:coverage    # Unit tests with coverage report
pnpm test:e2e         # Playwright E2E tests (requires dev server or starts one)
```

## Architecture Overview

This is a **Next.js 16 App Router** personal finance tracker with React 19, TypeScript, and Tailwind CSS v4.

### Auth Flow

- NextAuth v4 with Credentials, Google, and GitHub providers (`src/lib/auth.ts`)
- JWT strategy; session exposed via `providers.tsx` wrapping the app
- Demo login: `demo@financialtracker.com` / `demo123` — always accepted regardless of DynamoDB state
- `src/app/page.tsx` acts as a redirect gate: unauthenticated → `/login`, authenticated → `/dashboard`
- Email verification on registration (`src/lib/email-verification.ts`) — non-fatal if SMTP is not configured
- Password reset flow: `/forgot-password` → email link → `/reset-password` (`src/lib/password-reset.ts`)

### Data Layer

The primary data hook is `useFinancialDataWithDynamo` (`src/hooks/useFinancialDataWithDynamo.ts`). It:

- Accepts optional `initialData` (accounts + stocks) from the RSC layer to avoid double-fetching
- Loads accounts, stocks, snapshots, transactions, and budgets in parallel via `/api/*` routes
- Skips accounts/stocks fetch on first render when server-provided `initialData` is present
- Implements **optimistic updates** for all CRUD operations — state is updated immediately, rolled back on error
- Manages stock price updates (Alpha Vantage API) and currency rates (Open Exchange Rates API)
- All API routes use `getServerSession` to scope data to `session.user.id`

### RSC / Dashboard Architecture

```
src/app/dashboard/page.tsx        ← async Server Component
  └─ loadDashboardData()          ← src/app/dashboard/loader.ts (server-only, DynamoDB direct)
  └─ <DashboardClient />          ← src/app/dashboard/DashboardClient.tsx ('use client')
       └─ useFinancialDataWithDynamo({ initialData })
```

The loader fetches accounts and stocks server-side before the page renders, eliminating the loading flash. Transactions, snapshots, and budgets are always fetched client-side after hydration.

### DynamoDB Tables

Documented in `DYNAMODB_TABLES.md`. Seven tables, all `PAY_PER_REQUEST`:

- `finance-tracker-users` — PK: `userId`
- `finance-tracker-accounts` — PK: `id`, GSI: `userId-index`
- `finance-tracker-stocks` — PK: `symbol`, GSI: `userId-index`
- `finance-tracker-rates` — PK: `fromCurrency`, SK: `toCurrency#timestamp`
- `finance-tracker-transactions` — PK: `transactionId`, GSI: `userId-index` (SK: `date`)
- `finance-tracker-snapshots` — PK: `snapshotId`, GSI: `userId-index` (SK: `date`)
- `finance-tracker-budgets` — PK: `budgetId`, GSI: `userId-index`

### Financial Calculations

`src/lib/calculations.ts` contains the `FinancialCalculator` class:

- Aggregates accounts and stocks by currency
- Converts everything to USD using fetched exchange rates
- `calculatePortfolioPnL(stocks)` — per-stock unrealized P&L when `costBasis` is set

### Dashboard Structure

`src/app/dashboard/DashboardClient.tsx` renders a tabbed interface (Overview / Accounts / Stocks / Transactions / Budgets) powered by `src/components/DynamicTabs.tsx`. Tabs include:

- **Overview** — `TotalSummary` (draggable widgets), `NetWorthChart` (Recharts AreaChart of daily snapshots), `StockDistribution` (pie/treemap)
- **Accounts** — paginated `AccountCard` grid
- **Stocks** — paginated `StockCard` grid with P&L display when `costBasis` is set
- **Transactions** — `TransactionList` with add/edit/delete
- **Budgets** — `BudgetCard` grid with progress bar

All tabs are wrapped with `ErrorBoundary`. Forms render as modal overlays on `DashboardClient`.

### API Routes

All routes are rate-limited via `src/lib/with-rate-limit.ts` (default: 60 req/min, registration: 5/min). The in-memory rate limiter lives in `src/lib/rate-limit.ts`.

Key routes:

- `/api/accounts`, `/api/stocks`, `/api/transactions`, `/api/budgets`, `/api/snapshots` — full CRUD
- `/api/rates` — currency rate cache
- `/api/auth/register` — creates user + sends verification email (non-fatal if SMTP absent)
- `/api/auth/verify-email` — validates token, marks user verified
- `/api/auth/resend-verification` — generates new token and resends (always returns success)
- `/api/auth/forgot-password`, `/api/auth/reset-password` — password reset flow

### UI Components

- Shadcn/ui (new-york style, configured in `components.json`) — Button, Card, Input, Label, Select, Tabs, Badge
- Path alias `@/*` → `src/*`
- Tailwind CSS v4 with `oklch` color space and CSS variables for theming
- Dark/light mode via `ThemeProvider` context (persisted in `localStorage`)
- `src/components/ui/Pagination.tsx` + `src/hooks/usePagination.ts` — client-side pagination
- `src/components/ErrorBoundary.tsx` — React class component; wraps each dashboard tab

### External APIs

- **Stock prices**: Alpha Vantage (`GLOBAL_QUOTE` endpoint), rate-limited to 1 req/s — key in `ALPHA_VANTAGE_API_KEY`
- **Currency rates**: Open Exchange Rates — key in `EXCHANGE_RATE_API_KEY`
- Both have mock fallbacks on error

## Environment Variables

Copy `.env.dist` to `.env.local` and fill in values. All groups are optional except `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.

```
# Required
NEXTAUTH_SECRET
NEXTAUTH_URL

# AWS / DynamoDB (optional — demo mode without these)
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_DYNAMODB_USERS_TABLE
AWS_DYNAMODB_ACCOUNTS_TABLE
AWS_DYNAMODB_STOCKS_TABLE
AWS_DYNAMODB_RATES_TABLE
AWS_DYNAMODB_TRANSACTIONS_TABLE
AWS_DYNAMODB_SNAPSHOTS_TABLE
AWS_DYNAMODB_BUDGETS_TABLE

# External APIs (optional — mock fallbacks)
ALPHA_VANTAGE_API_KEY
EXCHANGE_RATE_API_KEY

# OAuth (optional)
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET

# SMTP / Email (optional — email features silently skipped if absent)
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS / SMTP_FROM
```
