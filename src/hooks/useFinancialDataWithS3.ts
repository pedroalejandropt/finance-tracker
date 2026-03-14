'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Account, Stock, CurrencyRate, GlobalTotals } from '@/types';
import { StockAPI, CurrencyAPI } from '@/lib/api';
import { FinancialCalculator } from '@/lib/calculations';
import { S3Storage } from '@/lib/s3';

export function useFinancialDataWithS3() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [totals, setTotals] = useState<GlobalTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Load user data from S3
  const loadUserData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Load accounts
      const accountsData = await S3Storage.getUserData(session.user.id, 'accounts');
      if (accountsData) {
        setAccounts(accountsData);
      } else {
        // Initialize with sample data if no data exists
        await initializeSampleData();
      }

      // Load stocks
      const stocksData = await S3Storage.getUserData(session.user.id, 'stocks');
      if (stocksData) {
        setStocks(stocksData);
      }

      // Load currency rates
      const ratesData = await S3Storage.getUserData(session.user.id, 'currency-rates');
      if (ratesData) {
        setCurrencyRates(ratesData);
      }

      await fetchCurrencyRates();
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize with sample data
  const initializeSampleData = async () => {
    const sampleAccounts: Account[] = [
      {
        accountId: '1',
        name: 'Checking Account',
        currency: 'USD',
        balance: 15000.0,
        type: 'bank',
      },
      {
        accountId: '2',
        name: 'Savings Account',
        currency: 'USD',
        balance: 45000.0,
        type: 'bank',
      },
      {
        accountId: '3',
        name: 'EUR Investment Account',
        currency: 'EUR',
        balance: 25000.0,
        type: 'investment',
      },
      {
        accountId: '4',
        name: 'Crypto Wallet',
        currency: 'USD',
        balance: 5000.0,
        type: 'crypto',
      },
    ];

    const sampleStocks: Stock[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        shares: 50,
        currentPrice: 175.5,
        currency: 'USD',
        type: 'stock',
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        shares: 20,
        currentPrice: 140.25,
        currency: 'USD',
        type: 'stock',
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        shares: 30,
        currentPrice: 380.75,
        currency: 'USD',
        type: 'stock',
      },
    ];

    setAccounts(sampleAccounts);
    setStocks(sampleStocks);

    // Save sample data to S3
    if (session?.user?.id) {
      await S3Storage.saveUserData(session.user.id, 'accounts', sampleAccounts);
      await S3Storage.saveUserData(session.user.id, 'stocks', sampleStocks);
    }
  };

  // Fetch currency rates
  const fetchCurrencyRates = async () => {
    try {
      const response = await CurrencyAPI.getExchangeRates('USD');
      const rates: CurrencyRate[] = Object.entries(response.rates).map(([to, rate]) => ({
        from: 'USD',
        to,
        rate,
        timestamp: new Date(),
      }));
      setCurrencyRates(rates);

      // Save currency rates to S3
      if (session?.user?.id) {
        await S3Storage.saveUserData(session.user.id, 'currency-rates', rates);
      }
    } catch (err) {
      console.error('Error fetching currency rates:', err);
      setError('Failed to fetch currency rates');
    }
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

      // Save updated stocks to S3
      if (session?.user?.id) {
        await S3Storage.saveUserData(session.user.id, 'stocks', updatedStocks);
      }
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

  // Load data when session changes
  useEffect(() => {
    if (session?.user?.id) {
      loadUserData();
    }
  }, [session]);

  // Save accounts to S3 whenever they change
  useEffect(() => {
    if (session?.user?.id && accounts.length > 0) {
      S3Storage.saveUserData(session.user.id, 'accounts', accounts);
    }
  }, [accounts, session]);

  // Save stocks to S3 whenever they change
  useEffect(() => {
    if (session?.user?.id && stocks.length > 0) {
      S3Storage.saveUserData(session.user.id, 'stocks', stocks);
    }
  }, [stocks, session]);

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
  const addAccount = async (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      accountId: Date.now().toString(),
    };
    setAccounts([...accounts, newAccount]);
  };

  // Update account
  const updateAccount = async (id: string, updates: Partial<Account>) => {
    setAccounts(
      accounts.map((account) => (account.accountId === id ? { ...account, ...updates } : account))
    );
  };

  // Delete account
  const deleteAccount = async (id: string) => {
    setAccounts(accounts.filter((account) => account.accountId !== id));
  };

  // Add new stock
  const addStock = async (stock: Omit<Stock, 'symbol'>) => {
    const newStock: Stock = {
      ...stock,
      symbol: `STOCK_${Date.now()}`,
    };
    setStocks([...stocks, newStock]);
  };

  // Update stock
  const updateStock = async (symbol: string, updates: Partial<Stock>) => {
    setStocks(stocks.map((stock) => (stock.symbol === symbol ? { ...stock, ...updates } : stock)));
  };

  // Delete stock
  const deleteStock = async (symbol: string) => {
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
