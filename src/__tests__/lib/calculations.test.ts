import { FinancialCalculator } from '@/lib/calculations';
import { Account, Stock, CurrencyRate } from '@/types';

const mockCurrencyRates: CurrencyRate[] = [
  { from: 'EUR', to: 'USD', rate: 1.1, timestamp: new Date() },
  { from: 'GBP', to: 'USD', rate: 1.25, timestamp: new Date() },
  { from: 'USD', to: 'EUR', rate: 0.9, timestamp: new Date() },
];

const mockAccounts: Account[] = [
  { accountId: 'acc1', name: 'Checking', currency: 'USD', balance: 1000, type: 'bank' },
  { accountId: 'acc2', name: 'Savings EUR', currency: 'EUR', balance: 500, type: 'bank' },
];

const mockStocks: Stock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    shares: 10,
    currentPrice: 150,
    currency: 'USD',
    type: 'stock',
  },
  {
    symbol: 'VOW',
    name: 'Volkswagen',
    shares: 5,
    currentPrice: 120,
    currency: 'EUR',
    type: 'stock',
  },
];

describe('FinancialCalculator', () => {
  describe('getExchangeRate', () => {
    it('returns 1 when from and to currencies are the same', () => {
      const rate = FinancialCalculator.getExchangeRate(mockCurrencyRates, 'USD', 'USD');
      expect(rate).toBe(1);
    });

    it('returns the direct rate when available', () => {
      const rate = FinancialCalculator.getExchangeRate(mockCurrencyRates, 'EUR', 'USD');
      expect(rate).toBe(1.1);
    });

    it('returns the inverse rate when only inverse is available', () => {
      // GBP to USD is 1.25, so USD to GBP should be 1/1.25 = 0.8
      const rate = FinancialCalculator.getExchangeRate(mockCurrencyRates, 'USD', 'GBP');
      expect(rate).toBeCloseTo(0.8, 5);
    });

    it('uses USD as intermediary when no direct rate exists', () => {
      const rates: CurrencyRate[] = [
        { from: 'EUR', to: 'USD', rate: 1.1, timestamp: new Date() },
        { from: 'USD', to: 'JPY', rate: 110, timestamp: new Date() },
      ];
      // EUR -> USD -> JPY = 1.1 * 110 = 121
      const rate = FinancialCalculator.getExchangeRate(rates, 'EUR', 'JPY');
      expect(rate).toBeCloseTo(121, 5);
    });

    it('returns 1 as fallback when no rate is found', () => {
      const rate = FinancialCalculator.getExchangeRate([], 'XYZ', 'ABC');
      expect(rate).toBe(1);
    });
  });

  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      const result = FinancialCalculator.formatCurrency(1234.56, 'USD');
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('formats EUR correctly', () => {
      const result = FinancialCalculator.formatCurrency(1000, 'EUR');
      expect(result).toContain('1,000.00');
    });

    it('formats zero correctly', () => {
      const result = FinancialCalculator.formatCurrency(0, 'USD');
      expect(result).toContain('0.00');
    });

    it('formats negative numbers correctly', () => {
      const result = FinancialCalculator.formatCurrency(-500, 'USD');
      expect(result).toContain('500.00');
    });

    it('always shows 2 decimal places', () => {
      const result = FinancialCalculator.formatCurrency(100, 'USD');
      expect(result).toMatch(/100\.00/);
    });
  });

  describe('calculateTotalsByCurrency', () => {
    it('groups accounts by currency', () => {
      const result = FinancialCalculator.calculateTotalsByCurrency(
        mockAccounts,
        [],
        mockCurrencyRates
      );
      const currencies = result.map((r) => r.currency);
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
    });

    it('calculates correct totals for USD accounts', () => {
      const accounts: Account[] = [
        { accountId: 'a1', name: 'A', currency: 'USD', balance: 500, type: 'bank' },
        { accountId: 'a2', name: 'B', currency: 'USD', balance: 300, type: 'bank' },
      ];
      const result = FinancialCalculator.calculateTotalsByCurrency(accounts, [], []);
      const usdTotals = result.find((r) => r.currency === 'USD');
      expect(usdTotals).toBeDefined();
      expect(usdTotals?.totalInCurrency).toBe(800);
      expect(usdTotals?.totalInUSD).toBe(800);
    });

    it('converts EUR accounts to USD using exchange rate', () => {
      const accounts: Account[] = [
        { accountId: 'e1', name: 'EU', currency: 'EUR', balance: 100, type: 'bank' },
      ];
      const result = FinancialCalculator.calculateTotalsByCurrency(accounts, [], mockCurrencyRates);
      const eurTotals = result.find((r) => r.currency === 'EUR');
      expect(eurTotals?.totalInCurrency).toBe(100);
      expect(eurTotals?.totalInUSD).toBeCloseTo(110, 5);
    });

    it('includes stocks in the totals', () => {
      const result = FinancialCalculator.calculateTotalsByCurrency(
        [],
        mockStocks,
        mockCurrencyRates
      );
      const usdTotals = result.find((r) => r.currency === 'USD');
      // AAPL: 10 shares * $150 = $1500
      expect(usdTotals?.totalInCurrency).toBe(1500);
      expect(usdTotals?.stocks).toHaveLength(1);
      expect(usdTotals?.stocks[0].symbol).toBe('AAPL');
    });

    it('returns empty array when no accounts or stocks', () => {
      const result = FinancialCalculator.calculateTotalsByCurrency([], [], []);
      expect(result).toHaveLength(0);
    });

    it('includes account references in the result', () => {
      const result = FinancialCalculator.calculateTotalsByCurrency(
        mockAccounts,
        [],
        mockCurrencyRates
      );
      const usdTotals = result.find((r) => r.currency === 'USD');
      expect(usdTotals?.accounts).toHaveLength(1);
      expect(usdTotals?.accounts[0].accountId).toBe('acc1');
    });
  });

  describe('calculateGlobalTotals', () => {
    it('returns a totalUSD summing all currencies', () => {
      const accounts: Account[] = [
        { accountId: 'a1', name: 'A', currency: 'USD', balance: 1000, type: 'bank' },
        { accountId: 'a2', name: 'B', currency: 'EUR', balance: 100, type: 'bank' },
      ];
      const result = FinancialCalculator.calculateGlobalTotals(accounts, [], mockCurrencyRates);
      // USD: 1000, EUR: 100 * 1.1 = 110 => total 1110
      expect(result.totalUSD).toBeCloseTo(1110, 5);
      expect(result.totalsByCurrency).toHaveLength(2);
    });
  });

  describe('calculatePortfolioChange', () => {
    it('calculates positive change correctly', () => {
      const result = FinancialCalculator.calculatePortfolioChange(1100, 1000);
      expect(result.change).toBe(100);
      expect(result.changePercent).toBe(10);
    });

    it('calculates negative change correctly', () => {
      const result = FinancialCalculator.calculatePortfolioChange(900, 1000);
      expect(result.change).toBe(-100);
      expect(result.changePercent).toBe(-10);
    });

    it('returns 0 percent change when previous total is 0', () => {
      const result = FinancialCalculator.calculatePortfolioChange(500, 0);
      expect(result.change).toBe(500);
      expect(result.changePercent).toBe(0);
    });
  });
});
