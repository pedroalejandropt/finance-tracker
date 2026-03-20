'use client';

import { useState, useEffect } from 'react';
import { Account, Stock, CurrencyRate, GlobalTotals } from '@/types';
import { StockAPI } from '@/lib/api';
import { FinancialCalculator } from '@/lib/calculations';

export function useFinancialData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [totals, setTotals] = useState<GlobalTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Initialize with demo data (clearly fictional values)
  const initializeSampleData = () => {
    const sampleAccounts: Account[] = [
      {
        accountId: '1',
        name: 'Demo Checking',
        currency: 'USD',
        balance: 12_000,
        type: 'bank',
      },
      {
        accountId: '2',
        name: 'Demo Savings',
        currency: 'USD',
        balance: 34_000,
        type: 'bank',
      },
      {
        accountId: '3',
        name: 'Demo EUR Account',
        currency: 'EUR',
        balance: 18_000,
        type: 'investment',
      },
      {
        accountId: '4',
        name: 'Demo Crypto',
        currency: 'USD',
        balance: 3_000,
        type: 'crypto',
      },
    ];

    const sampleStocks: Stock[] = [
      {
        symbol: 'DEMO1',
        name: 'Demo Corp A',
        shares: 100,
        currentPrice: 50,
        currency: 'USD',
        type: 'stock',
      },
      {
        symbol: 'DEMO2',
        name: 'Demo Corp B',
        shares: 200,
        currentPrice: 25,
        currency: 'USD',
        type: 'etf',
      },
      {
        symbol: 'DEMO3',
        name: 'Demo Euro Fund',
        shares: 150,
        currentPrice: 40,
        currency: 'EUR',
        type: 'etf',
      },
      {
        symbol: 'DEMO4',
        name: 'Demo Tech Inc',
        shares: 80,
        currentPrice: 75,
        currency: 'USD',
        type: 'stock',
      },
    ];

    setAccounts(sampleAccounts);
    setStocks(sampleStocks);
  };

  // Use hardcoded demo rates — no real API call
  const fetchCurrencyRates = async () => {
    const demoRates: CurrencyRate[] = [
      { from: 'USD', to: 'EUR', rate: 0.92, timestamp: new Date() },
      { from: 'USD', to: 'GBP', rate: 0.79, timestamp: new Date() },
      { from: 'USD', to: 'USD', rate: 1.0, timestamp: new Date() },
    ];
    setCurrencyRates(demoRates);
  };

  // Update stock prices
  const updateStockPrices = async () => {
    try {
      const updatedStocks = [];

      // Process stocks sequentially to respect API rate limits
      for (const stock of stocks) {
        const quote = await StockAPI.getQuote(stock.symbol);
        updatedStocks.push({
          ...stock,
          currentPrice: quote.price,
        });

        // Add delay to respect API rate limits (1 request per second)
        if (stocks.indexOf(stock) < stocks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1200)); // 1.2 seconds to be safe
        }
      }

      setStocks(updatedStocks);
    } catch (err) {
      console.error('Error updating stock prices:', err);
      setError('Failed to update stock prices');
    }
  };

  // Calculate totals whenever data changes
  useEffect(() => {
    if (accounts.length > 0 || stocks.length > 0) {
      const calculatedTotals = FinancialCalculator.calculateGlobalTotals(
        accounts,
        stocks,
        currencyRates,
        baseCurrency
      );
      setTotals(calculatedTotals);
    }
  }, [accounts, stocks, currencyRates, baseCurrency]);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        initializeSampleData();
        await fetchCurrencyRates();
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to initialize data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchCurrencyRates();
      await updateStockPrices();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Add new account
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      accountId: Date.now().toString(),
    };
    setAccounts([...accounts, newAccount]);
  };

  // Update account
  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(
      accounts.map((account) => (account.accountId === id ? { ...account, ...updates } : account))
    );
  };

  // Delete account
  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter((account) => account.accountId !== id));
  };

  // Add new stock
  const addStock = (stock: Omit<Stock, 'symbol'>) => {
    const newStock: Stock = {
      ...stock,
      symbol: `STOCK_${Date.now()}`,
    };
    setStocks([...stocks, newStock]);
  };

  // Update stock
  const updateStock = (symbol: string, updates: Partial<Stock>) => {
    setStocks(stocks.map((stock) => (stock.symbol === symbol ? { ...stock, ...updates } : stock)));
  };

  // Delete stock
  const deleteStock = (symbol: string) => {
    setStocks(stocks.filter((stock) => stock.symbol !== symbol));
  };

  return {
    accounts,
    stocks,
    currencyRates,
    totals,
    loading,
    error,
    baseCurrency,
    setBaseCurrency,
    refreshData,
    addAccount,
    updateAccount,
    deleteAccount,
    addStock,
    updateStock,
    deleteStock,
    updateStockPrices,
  };
}
