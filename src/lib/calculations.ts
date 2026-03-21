import { Account, Stock, CurrencyRate, TotalsByCurrency, GlobalTotals } from '@/types';

export class FinancialCalculator {
  static calculateTotalsByCurrency(
    accounts: Account[],
    stocks: Stock[],
    currencyRates: CurrencyRate[],
    targetCurrency: string = 'USD'
  ): TotalsByCurrency[] {
    const currencyMap = new Map<string, TotalsByCurrency>();

    // Process accounts
    accounts.forEach((account) => {
      const currency = account.currency;
      const rate = this.getExchangeRate(currencyRates, currency, targetCurrency);
      const amountInUSD = account.balance * rate;

      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, {
          currency,
          totalInCurrency: 0,
          totalInUSD: 0,
          accounts: [],
          stocks: [],
        });
      }

      const totals = currencyMap.get(currency)!;
      totals.totalInCurrency += account.balance;
      totals.totalInUSD += amountInUSD;
      totals.accounts.push({
        accountId: account.accountId,
        amount: account.balance,
      });
    });

    // Process stocks
    stocks.forEach((stock) => {
      const currency = stock.currency;
      const stockValue = stock.shares * stock.currentPrice;
      const rate = this.getExchangeRate(currencyRates, currency, targetCurrency);
      const valueInUSD = stockValue * rate;

      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, {
          currency,
          totalInCurrency: 0,
          totalInUSD: 0,
          accounts: [],
          stocks: [],
        });
      }

      const totals = currencyMap.get(currency)!;
      totals.totalInCurrency += stockValue;
      totals.totalInUSD += valueInUSD;
      totals.stocks.push({
        symbol: stock.symbol,
        value: stockValue,
      });
    });

    return Array.from(currencyMap.values());
  }

  static calculateGlobalTotals(
    accounts: Account[],
    stocks: Stock[],
    currencyRates: CurrencyRate[],
    targetCurrency: string = 'USD'
  ): GlobalTotals {
    const totalsByCurrency = this.calculateTotalsByCurrency(
      accounts,
      stocks,
      currencyRates,
      targetCurrency
    );

    const totalUSD = totalsByCurrency.reduce((sum, total) => sum + total.totalInUSD, 0);

    return {
      totalUSD,
      totalsByCurrency,
    };
  }

  static getExchangeRate(
    currencyRates: CurrencyRate[],
    fromCurrency: string,
    toCurrency: string
  ): number {
    if (fromCurrency === toCurrency) return 1;

    // Find direct rate
    const directRate = currencyRates.find(
      (rate) => rate.from === fromCurrency && rate.to === toCurrency
    );
    if (directRate) return directRate.rate;

    // Try inverse rate
    const inverseRate = currencyRates.find(
      (rate) => rate.from === toCurrency && rate.to === fromCurrency
    );
    if (inverseRate) return 1 / inverseRate.rate;

    // Try USD as intermediary
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromToUSD = currencyRates.find(
        (rate) => rate.from === fromCurrency && rate.to === 'USD'
      );
      const usdToTo = currencyRates.find((rate) => rate.from === 'USD' && rate.to === toCurrency);
      if (fromToUSD && usdToTo) {
        return fromToUSD.rate * usdToTo.rate;
      }
    }

    // Default to 1 if no rate found
    return 1;
  }

  static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  static calculatePortfolioChange(
    currentTotal: number,
    previousTotal: number
  ): { change: number; changePercent: number } {
    const change = currentTotal - previousTotal;
    const changePercent = previousTotal !== 0 ? (change / previousTotal) * 100 : 0;

    return { change, changePercent };
  }

  /**
   * Computes unrealized P&L for all stocks that have a cost basis set.
   * Returns totals in each stock's native currency (not converted).
   */
  static calculatePortfolioPnL(stocks: Stock[]): {
    totalUnrealizedPnL: number; // summed in USD equivalent (using 1:1 for simplicity)
    stocksWithPnL: {
      symbol: string;
      name: string;
      currency: string;
      totalValue: number;
      totalCost: number;
      unrealizedPnL: number;
      unrealizedPnLPct: number;
    }[];
  } {
    const stocksWithPnL = stocks
      .filter((s) => s.costBasis !== undefined && s.costBasis > 0)
      .map((s) => {
        const totalValue = s.shares * s.currentPrice;
        const totalCost = s.costBasis! * s.shares;
        const unrealizedPnL = totalValue - totalCost;
        const unrealizedPnLPct = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;
        return {
          symbol: s.symbol,
          name: s.name,
          currency: s.currency,
          totalValue,
          totalCost,
          unrealizedPnL,
          unrealizedPnLPct,
        };
      });

    const totalUnrealizedPnL = stocksWithPnL.reduce((sum, s) => sum + s.unrealizedPnL, 0);

    return { totalUnrealizedPnL, stocksWithPnL };
  }
}
