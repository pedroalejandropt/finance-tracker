# Financial Tracker

A personal finance dashboard built with Next.js, AWS DynamoDB, and real-time market data. Track bank accounts, investment portfolios, and stock positions across multiple currencies — all in one place.

> Screenshots below use demo data only — no real financial information is shown.

## Screenshots

### Login

![Login](screenshots/01-login.png)

### Dashboard Overview

![Dashboard Overview](screenshots/02-dashboard-overview.png)

### Stock Distribution — By Currency

![By Currency](screenshots/03-chart-by-currency.png)

### Stock Distribution — Treemap

![Treemap](screenshots/04-chart-treemap.png)

### Stock Distribution — Stocks vs ETFs

![Stocks vs ETFs](screenshots/05-chart-stocks-vs-etfs.png)

### Stock Distribution — Individual Stocks

![Stocks](screenshots/06-chart-stocks.png)

### Accounts

![Accounts](screenshots/07-dashboard-accounts.png)

### Stock Portfolio

![Stocks](screenshots/08-dashboard-stocks.png)

## Features

- **Multi-currency support** — track accounts and stocks in USD, EUR, GBP, and more; totals converted to a single base currency
- **Portfolio overview** — draggable widget showing total portfolio value
- **Stock distribution charts** — pie by currency, treemap, Stocks vs ETFs, and per-stock breakdowns
- **Account management** — add, edit, and delete bank, investment, crypto, and cash accounts
- **Stock portfolio management** — add, edit, and delete stock positions with live price refresh (Alpha Vantage)
- **Dark / light mode** — persisted per user in `localStorage`
- **Authentication** — credential-based login with bcrypt password hashing and JWT sessions
- **User registration** — sign up with email and password (stored in DynamoDB)
- **Persistent storage** — all data stored in AWS DynamoDB via server-side API routes
- **Demo mode** — works fully without DynamoDB configured (in-memory demo data)

## Tech Stack

| Layer           | Technology                           |
| --------------- | ------------------------------------ |
| Framework       | Next.js 16 (App Router)              |
| UI              | React 19, Tailwind CSS v4, shadcn/ui |
| Charts          | Recharts                             |
| Auth            | NextAuth v4, bcryptjs                |
| Database        | AWS DynamoDB                         |
| Validation      | Zod                                  |
| Package manager | pnpm                                 |
| CI              | GitHub Actions                       |
| Testing         | Jest (unit), Playwright (E2E)        |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- AWS account with DynamoDB tables (see [DynamoDB setup](#dynamodb-setup)) — optional, app runs in demo mode without it

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file at the project root:

```env
# Auth
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000

# AWS (optional — omit to run in demo mode)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# DynamoDB table names
AWS_DYNAMODB_USERS_TABLE=finance-tracker-users
AWS_DYNAMODB_ACCOUNTS_TABLE=finance-tracker-accounts
AWS_DYNAMODB_STOCKS_TABLE=finance-tracker-stocks
AWS_DYNAMODB_RATES_TABLE=finance-tracker-rates
AWS_DYNAMODB_TRANSACTIONS_TABLE=finance-tracker-transactions

# External APIs (optional — mock data used as fallback)
ALPHA_VANTAGE_API_KEY=your-key
EXCHANGE_RATE_API_KEY=your-key
```

### Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo credentials** (when AWS is not configured): `demo@financialtracker.com` / `demo123`

## DynamoDB Setup

Create the four tables with the AWS CLI:

```bash
# Users
aws dynamodb create-table \
  --table-name finance-tracker-users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Accounts (with userId GSI)
aws dynamodb create-table \
  --table-name finance-tracker-accounts \
  --attribute-definitions AttributeName=id,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[{"IndexName":"userId-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"},"BillingMode":"PAY_PER_REQUEST"}]' \
  --billing-mode PAY_PER_REQUEST

# Stocks (with userId GSI)
aws dynamodb create-table \
  --table-name finance-tracker-stocks \
  --attribute-definitions AttributeName=symbol,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=symbol,KeyType=HASH \
  --global-secondary-indexes '[{"IndexName":"userId-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"},"BillingMode":"PAY_PER_REQUEST"}]' \
  --billing-mode PAY_PER_REQUEST

# Currency rates
aws dynamodb create-table \
  --table-name finance-tracker-rates \
  --attribute-definitions AttributeName=fromCurrency,AttributeType=S AttributeName="toCurrency#timestamp",AttributeType=S \
  --key-schema AttributeName=fromCurrency,KeyType=HASH AttributeName="toCurrency#timestamp",KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

## Commands

```bash
pnpm dev            # Start dev server
pnpm build          # Production build
pnpm lint           # ESLint
pnpm format         # Prettier
pnpm test           # Unit tests
pnpm test:coverage  # Unit tests with coverage
pnpm test:e2e       # Playwright E2E tests
```

## Project Structure

```
src/
├── app/
│   ├── api/            # Server-side API routes (accounts, stocks, rates, auth)
│   ├── dashboard/      # Main dashboard page
│   ├── login/          # Login page
│   └── register/       # Registration page
├── components/
│   ├── charts/         # Recharts wrappers (PieChart, Treemap)
│   ├── account/        # Account form components
│   ├── stock/          # Stock form components
│   └── ui/             # shadcn/ui primitives
├── hooks/              # useFinancialDataWithDynamo (primary data hook)
├── lib/                # Auth, DynamoDB helpers, calculations, external APIs
└── types/              # Shared TypeScript interfaces
```
