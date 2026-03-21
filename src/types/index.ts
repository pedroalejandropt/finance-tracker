export interface Account {
  accountId: string;
  name: string;
  currency: string;
  balance: number;
  type: 'bank' | 'investment' | 'crypto' | 'cash';
}

export interface Stock {
  symbol: string;
  name: string;
  shares: number;
  currentPrice: number;
  costBasis?: number; // average purchase price per share (optional, for P&L)
  currency: string;
  type: string;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export interface Portfolio {
  accounts: Account[];
  stocks: Stock[];
  currencyRates: CurrencyRate[];
}

export interface TotalsByCurrency {
  currency: string;
  totalInCurrency: number;
  totalInUSD: number;
  accounts: { accountId: string; amount: number }[];
  stocks: { symbol: string; value: number }[];
}

export interface GlobalTotals {
  totalUSD: number;
  totalsByCurrency: TotalsByCurrency[];
}
