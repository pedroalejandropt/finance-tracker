'use client';

import { useState, useEffect } from 'react';
import { Account, Stock, CurrencyRate, GlobalTotals } from '@/types';
import { CurrencyAPI } from '@/lib/api';
import { FinancialCalculator } from '@/lib/calculations';

export function useFinancialDataWithDynamo() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [totals, setTotals] = useState<GlobalTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Load initial data from API routes (which access DynamoDB server-side)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load accounts and stocks in parallel
        try {
          const [accountsRes, stocksRes] = await Promise.all([
            fetch('/api/accounts'),
            fetch('/api/stocks'),
          ]);

          if (accountsRes.ok) {
            const data = await accountsRes.json();
            setAccounts(Array.isArray(data) ? data : []);
          }

          if (stocksRes.ok) {
            const data = await stocksRes.json();
            setStocks(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error('Error loading data from API:', err);
        }

        // Load currency rates
        try {
          const ratesRes = await fetch(`/api/rates?from=${baseCurrency}`);
          if (ratesRes.ok) {
            const rates: CurrencyRate[] = await ratesRes.json();
            if (rates.length > 0) {
              setCurrencyRates(rates);
            } else {
              // Fetch from external API and cache in DynamoDB
              const apiRates = await CurrencyAPI.getExchangeRates(baseCurrency);
              const currencyRateArray: CurrencyRate[] = Object.entries(apiRates.rates).map(
                ([to, rate]) => ({
                  from: apiRates.base,
                  to,
                  rate,
                  timestamp: new Date(),
                })
              );

              setCurrencyRates(currencyRateArray);

              // Save rates via API route (fire-and-forget)
              // Promise.all(
              //   currencyRateArray.map((rate) =>
              //     fetch('/api/rates', {
              //       method: 'POST',
              //       headers: { 'Content-Type': 'application/json' },
              //       body: JSON.stringify(rate),
              //     })
              //   )
              // ).catch((err) => console.error('Error caching currency rates:', err));
            }
          }
        } catch (err) {
          console.error('Error loading currency rates:', err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [baseCurrency]);

  // Calculate totals
  useEffect(() => {
    if (accounts.length > 0 || stocks.length > 0 || currencyRates.length > 0) {
      const calculatedTotals = FinancialCalculator.calculateGlobalTotals(
        accounts,
        stocks,
        currencyRates,
        baseCurrency
      );
      setTotals(calculatedTotals);
    }
  }, [accounts, stocks, currencyRates, baseCurrency]);

  // CRUD Operations for Accounts
  const addAccount = async (account: Omit<Account, 'accountId'>) => {
    try {
      const newAccount: Account = {
        ...account,
        accountId: Date.now().toString(),
      };

      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });

      setAccounts((prev) => [...prev, newAccount]);
    } catch (err) {
      console.error('Error adding account:', err);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const account = accounts.find((a) => a.accountId === id);
      if (account) {
        await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...account, ...updates }),
        });
      }

      setAccounts((prev) =>
        prev.map((account) => (account.accountId === id ? { ...account, ...updates } : account))
      );
    } catch (err) {
      console.error('Error updating account:', err);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: id }),
      });

      setAccounts((prev) => prev.filter((account) => account.accountId !== id));
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  // CRUD Operations for Stocks
  const addStock = async (stock: Stock) => {
    try {
      await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stock),
      });

      setStocks((prev) => [...prev, stock]);
    } catch (err) {
      console.error('Error adding stock:', err);
    }
  };

  const updateStock = async (symbol: string, updates: Partial<Stock>) => {
    try {
      const stock = stocks.find((s) => s.symbol === symbol);
      if (stock) {
        await fetch('/api/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...stock, ...updates }),
        });
      }

      setStocks((prev) =>
        prev.map((stock) => (stock.symbol === symbol ? { ...stock, ...updates } : stock))
      );
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const deleteStock = async (symbol: string) => {
    try {
      await fetch('/api/stocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      setStocks((prev) => prev.filter((stock) => stock.symbol !== symbol));
    } catch (err) {
      console.error('Error deleting stock:', err);
    }
  };

  // Update stock prices with rate limiting
  const updateStockPrices = async () => {
    try {
      const { StockAPI } = await import('@/lib/api');
      const updatedStocks = [...stocks];

      for (let i = 0; i < updatedStocks.length; i++) {
        const stock = updatedStocks[i];
        try {
          const quote = await StockAPI.getQuote(stock.symbol);
          updatedStocks[i] = { ...stock, currentPrice: quote.price };

          if (i < updatedStocks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.error(`Failed to update price for ${stock.symbol}:`, err);
        }
      }

      setStocks(updatedStocks);

      // Persist updated prices
      await Promise.all(
        updatedStocks.map((stock) =>
          fetch('/api/stocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stock),
          })
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock prices');
    }
  };

  return {
    // Data
    accounts,
    stocks,
    currencyRates,
    totals,
    loading,
    error,
    baseCurrency,
    setBaseCurrency,

    // Operations
    updateStockPrices,

    // Account CRUD
    addAccount,
    updateAccount,
    deleteAccount,

    // Stock CRUD
    addStock,
    updateStock,
    deleteStock,
  };
}
