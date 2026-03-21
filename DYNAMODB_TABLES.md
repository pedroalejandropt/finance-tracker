# DynamoDB Table Structure for Financial Tracker

## Overview

This document outlines the recommended DynamoDB table structure for the financial tracker application.

## Tables

### 1. Users Table (`finance-tracker-users`)

**Primary Key:** `userId` (String)

**Attributes:**

- `userId` (String) - Primary Key
- `email` (String) - User email address
- `name` (String) - User display name
- `createdAt` (String) - ISO timestamp
- `updatedAt` (String) - ISO timestamp

**Example Item:**

```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. Accounts Table (`finance-tracker-accounts`)

**Primary Key:** `id` (String)

**Global Secondary Index (GSI):**

- **Index Name:** `userId-index`
- **Partition Key:** `userId` (String)

**Attributes:**

- `id` (String) - Primary Key, unique account identifier
- `userId` (String) - Foreign key to Users table
- `name` (String) - Account name
- `currency` (String) - Account currency (USD, EUR, etc.)
- `balance` (Number) - Account balance
- `type` (String) - Account type (bank, investment, crypto, cash)
- `createdAt` (String) - ISO timestamp
- `updatedAt` (String) - ISO timestamp

**Example Item:**

```json
{
  "id": "acc_123",
  "userId": "user_123",
  "name": "Checking Account",
  "currency": "USD",
  "balance": 15000.0,
  "type": "bank",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. Stocks Table (`finance-tracker-stocks`)

**Primary Key:** `symbol` (String)

**Global Secondary Index (GSI):**

- **Index Name:** `userId-index`
- **Partition Key:** `userId` (String)

**Attributes:**

- `symbol` (String) - Primary Key, stock symbol
- `userId` (String) - Foreign key to Users table
- `name` (String) - Company name
- `shares` (Number) - Number of shares owned
- `currentPrice` (Number) - Current price per share
- `currency` (String) - Stock currency
- `type` (String) - Investment type (stock, etf, crypto)
- `createdAt` (String) - ISO timestamp
- `updatedAt` (String) - ISO timestamp

**Example Item:**

```json
{
  "symbol": "AAPL",
  "userId": "user_123",
  "name": "Apple Inc.",
  "shares": 100,
  "currentPrice": 150.0,
  "currency": "USD",
  "type": "stock",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Net Worth Snapshots Table (`finance-tracker-snapshots`)

**Primary Key:** `snapshotId` (String)

**Global Secondary Index (GSI):** `userId-index` — PK: `userId`, SK: `date`

One snapshot is written per user per day automatically when the dashboard loads.

**Example Item:**

```json
{
  "snapshotId": "uuid",
  "userId": "user_123",
  "date": "2024-03-15",
  "totalUSD": 85400.0,
  "baseCurrency": "USD",
  "createdAt": "2024-03-15T08:00:00.000Z"
}
```

### 5. Currency Rates Table (`finance-tracker-rates`)

**Primary Key:** `fromCurrency` (String)
**Sort Key:** `toCurrency#timestamp` (String)

**Attributes:**

- `fromCurrency` (String) - Base currency (Partition Key)
- `toCurrency#timestamp` (String) - Target currency + timestamp (Sort Key)
- `from` (String) - Base currency code
- `to` (String) - Target currency code
- `rate` (Number) - Exchange rate
- `timestamp` (String) - ISO timestamp

**Example Item:**

```json
{
  "fromCurrency": "USD",
  "toCurrency#timestamp": "EUR#2024-01-01T12:00:00.000Z",
  "from": "USD",
  "to": "EUR",
  "rate": 0.85,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## AWS CLI Commands to Create Tables

### Users Table

```bash
aws dynamodb create-table \
  --table-name finance-tracker-users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Accounts Table

```bash
aws dynamodb create-table \
  --table-name finance-tracker-accounts \
  --attribute-definitions AttributeName=id,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "userId-index",
        "KeySchema": [{"AttributeName":"userId","KeyType":"HASH"}],
        "Projection":{"ProjectionType":"ALL"},
        "BillingMode":"PAY_PER_REQUEST"
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Stocks Table

```bash
aws dynamodb create-table \
  --table-name finance-tracker-stocks \
  --attribute-definitions AttributeName=symbol,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=symbol,KeyType=HASH \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "userId-index",
        "KeySchema": [{"AttributeName":"userId","KeyType":"HASH"}],
        "Projection":{"ProjectionType":"ALL"},
        "BillingMode":"PAY_PER_REQUEST"
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Currency Rates Table

```bash
aws dynamodb create-table \
  --table-name finance-tracker-rates \
  --attribute-definitions AttributeName=fromCurrency,AttributeType=S AttributeName=toCurrency#timestamp,AttributeType=S \
  --key-schema AttributeName=fromCurrency,KeyType=HASH AttributeName=toCurrency#timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Environment Variables

Add these to your `.env.local` file:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# DynamoDB Table Names
AWS_DYNAMODB_USERS_TABLE=finance-tracker-users
AWS_DYNAMODB_ACCOUNTS_TABLE=finance-tracker-accounts
AWS_DYNAMODB_STOCKS_TABLE=finance-tracker-stocks
AWS_DYNAMODB_RATES_TABLE=finance-tracker-rates
```

## Data Access Patterns

### Get all accounts for a user

```javascript
// Uses GSI: userId-index
const params = {
  TableName: 'finance-tracker-accounts',
  IndexName: 'userId-index',
  KeyConditionExpression: 'userId = :userId',
  ExpressionAttributeValues: {
    ':userId': userId,
  },
};
```

### Get all stocks for a user

```javascript
// Uses GSI: userId-index
const params = {
  TableName: 'finance-tracker-stocks',
  IndexName: 'userId-index',
  KeyConditionExpression: 'userId = :userId',
  ExpressionAttributeValues: {
    ':userId': userId,
  },
};
```

### Get currency rates for a base currency

```javascript
// Uses composite key
const params = {
  TableName: 'finance-tracker-rates',
  KeyConditionExpression: 'fromCurrency = :fromCurrency',
  ExpressionAttributeValues: {
    ':fromCurrency': 'USD',
  },
};
```

## Considerations

1. **Scalability:** Each table uses PAY_PER_REQUEST billing mode for automatic scaling.
2. **Performance:** GSIs on userId enable fast queries for user-specific data.
3. **Data Isolation:** Each user's data is isolated by userId for security.
4. **Time-series:** Currency rates use composite keys for time-series data.
5. **Cost Optimization:** Consider TTL for old currency rate data to manage storage costs.
