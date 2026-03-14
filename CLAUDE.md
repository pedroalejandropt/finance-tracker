# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint

# No test suite is currently configured
```

## Architecture Overview

This is a **Next.js 16 App Router** personal finance tracker with React 19, TypeScript, and Tailwind CSS v4.

### Auth Flow

- NextAuth v4 with Credentials provider (`src/lib/auth.ts`)
- JWT strategy; session exposed via `providers.tsx` wrapping the app
- Demo login: `demo@financialtracker.com` / `demo123` — auth currently accepts any credentials
- `src/app/page.tsx` acts as a redirect gate: unauthenticated → `/login`, authenticated → `/dashboard`

### Data Layer

The primary data hook is `useFinancialDataWithDynamo` (`src/hooks/useFinancialDataWithDynamo.ts`). It:

- Connects to AWS DynamoDB for CRUD on accounts, stocks, and currency rates
- Falls back to sample data if DynamoDB is unavailable
- Manages stock price updates (Alpha Vantage API) and currency rates (Open Exchange Rates API)
- Currently uses a hardcoded `userId = 'current-user'` instead of pulling from the session

`useFinancialData` (`src/hooks/useFinancialData.ts`) is a legacy hook using only mock/sample data — kept for offline/testing use.

`useFinancialDataWithS3` is present but unused.

### DynamoDB Tables

Documented in `DYNAMODB_TABLES.md`. Four tables, all `PAY_PER_REQUEST`:

- `finance-tracker-users` — PK: `userId`
- `finance-tracker-accounts` — PK: `id`, GSI: `userId-index`
- `finance-tracker-stocks` — PK: `symbol`, GSI: `userId-index`
- `finance-tracker-rates` — PK: `fromCurrency`, SK: `toCurrency#timestamp`

### Financial Calculations

`src/lib/calculations.ts` contains the `FinancialCalculator` class:

- Aggregates accounts and stocks by currency
- Converts everything to USD using fetched exchange rates
- Used by the dashboard to compute `TotalsByCurrency` and `GlobalTotals`

### Dashboard Structure

`src/app/dashboard/page.tsx` renders a tabbed interface (Overview / Accounts / Stocks) powered by `DynamicTabs.tsx`. The Overview tab includes:

- `TotalSummary` — a grid of draggable widgets (`useWidgets` hook)
- `StockDistribution` — pie/treemap charts via Recharts

Forms (add/edit accounts and stocks) are rendered as modal overlays on the dashboard page.

### UI Components

- Shadcn/ui (new-york style, configured in `components.json`) — Button, Card, Input, Label, Select, Tabs, Badge
- Path alias `@/*` → `src/*`
- Tailwind CSS v4 with `oklch` color space and CSS variables for theming
- Dark/light mode via `ThemeProvider` context (persisted in `localStorage`)

### External APIs

- **Stock prices**: Alpha Vantage (`GLOBAL_QUOTE` endpoint), rate-limited to 1 req/s — key in `ALPHA_VANTAGE_API_KEY` env var
- **Currency rates**: Open Exchange Rates — key in `EXCHANGE_RATE_API_KEY` env var
- Both have mock fallbacks on error

## Environment Variables

Required in `.env.local`:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
DYNAMODB_TABLE_USERS
DYNAMODB_TABLE_ACCOUNTS
DYNAMODB_TABLE_STOCKS
DYNAMODB_TABLE_RATES
NEXTAUTH_SECRET
NEXTAUTH_URL
ALPHA_VANTAGE_API_KEY
EXCHANGE_RATE_API_KEY
```

> **Note**: `useFinancialDataWithDynamo.ts` currently has hardcoded AWS credential fallbacks. These must be removed and replaced with env vars only.

## Known Issues

- `userId` is hardcoded as `'current-user'` in the DynamoDB hook — should come from `session.user.id`
- Prisma is declared as a dependency but not actively used
- `useFinancialDataWithS3` is unused and can be removed
