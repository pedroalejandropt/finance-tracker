'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Account,
  Stock,
  CurrencyRate,
  GlobalTotals,
  NetWorthSnapshot,
  Transaction,
  Budget,
} from '@/types';
import { CurrencyAPI } from '@/lib/api';
import { FinancialCalculator } from '@/lib/calculations';

interface InitialData {
  accounts?: Account[];
  stocks?: Stock[];
}

export function useFinancialDataWithDynamo(initialData?: InitialData) {
  const [accounts, setAccounts] = useState<Account[]>(initialData?.accounts ?? []);
  const [stocks, setStocks] = useState<Stock[]>(initialData?.stocks ?? []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [totals, setTotals] = useState<GlobalTotals | null>(null);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Track whether this is the first load so we can skip fetching accounts/stocks
  // when they were already provided as server-side initial data.
  const isFirstLoad = useRef(true);
  const hasInitialData = useRef(
    (initialData?.accounts !== undefined && initialData.accounts.length > 0) ||
      (initialData?.stocks !== undefined && initialData.stocks.length > 0)
  );

  // Load initial data from API routes (which access DynamoDB server-side)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Skip fetching accounts and stocks on first load if initial data was provided
        // by the server. This avoids a redundant double-fetch.
        const skipAccountsStocks = isFirstLoad.current && hasInitialData.current;
        isFirstLoad.current = false;

        if (!skipAccountsStocks) {
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
        }

        // Load snapshots, transactions, and budgets in parallel (always needed)
        try {
          const [snapshotsRes, transactionsRes, budgetsRes] = await Promise.all([
            fetch('/api/snapshots'),
            fetch('/api/transactions'),
            fetch('/api/budgets'),
          ]);

          if (snapshotsRes.ok) {
            const data = await snapshotsRes.json();
            setSnapshots(Array.isArray(data) ? data : []);
          }

          if (transactionsRes.ok) {
            const data = await transactionsRes.json();
            setTransactions(Array.isArray(data) ? data : []);
          }

          if (budgetsRes.ok) {
            const data = await budgetsRes.json();
            setBudgets(Array.isArray(data) ? data : []);
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

  // Calculate totals and persist a daily net-worth snapshot
  useEffect(() => {
    if (accounts.length > 0 || stocks.length > 0 || currencyRates.length > 0) {
      const calculatedTotals = FinancialCalculator.calculateGlobalTotals(
        accounts,
        stocks,
        currencyRates,
        baseCurrency
      );
      setTotals(calculatedTotals);

      // Save a snapshot for today if we don't already have one
      const today = new Date().toISOString().split('T')[0];
      const alreadyHaveToday = snapshots.some((s) => s.date === today);
      if (!alreadyHaveToday && calculatedTotals.totalUSD > 0) {
        fetch('/api/snapshots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalUSD: calculatedTotals.totalUSD, baseCurrency }),
        })
          .then((res) => res.json())
          .then((saved: NetWorthSnapshot) => {
            setSnapshots((prev) => [...prev, saved]);
          })
          .catch(() => {});
      }
    }
  }, [accounts, stocks, currencyRates, baseCurrency]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearError = () => setError(null);

  // CRUD Operations for Accounts — optimistic updates with rollback on error
  const addAccount = async (account: Omit<Account, 'accountId'>) => {
    const newAccount: Account = { ...account, accountId: Date.now().toString() };
    const prev = accounts;
    setAccounts((cur) => [...cur, newAccount]); // optimistic
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });
    } catch {
      setAccounts(prev); // rollback
      setError('Failed to add account. Please try again.');
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    const prev = accounts;
    setAccounts((cur) => cur.map((a) => (a.accountId === id ? { ...a, ...updates } : a))); // optimistic
    try {
      const account = prev.find((a) => a.accountId === id);
      if (account) {
        await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...account, ...updates }),
        });
      }
    } catch {
      setAccounts(prev); // rollback
      setError('Failed to update account. Please try again.');
    }
  };

  const deleteAccount = async (id: string) => {
    const prev = accounts;
    setAccounts((cur) => cur.filter((a) => a.accountId !== id)); // optimistic
    try {
      await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: id }),
      });
    } catch {
      setAccounts(prev); // rollback
      setError('Failed to delete account. Please try again.');
    }
  };

  // CRUD Operations for Stocks — optimistic updates with rollback on error
  const addStock = async (stock: Stock) => {
    const prev = stocks;
    setStocks((cur) => [...cur, stock]); // optimistic
    try {
      await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stock),
      });
    } catch {
      setStocks(prev); // rollback
      setError('Failed to add stock. Please try again.');
    }
  };

  const updateStock = async (symbol: string, updates: Partial<Stock>) => {
    const prev = stocks;
    setStocks((cur) => cur.map((s) => (s.symbol === symbol ? { ...s, ...updates } : s))); // optimistic
    try {
      const stock = prev.find((s) => s.symbol === symbol);
      if (stock) {
        await fetch('/api/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...stock, ...updates }),
        });
      }
    } catch {
      setStocks(prev); // rollback
      setError('Failed to update stock. Please try again.');
    }
  };

  const deleteStock = async (symbol: string) => {
    const prev = stocks;
    setStocks((cur) => cur.filter((s) => s.symbol !== symbol)); // optimistic
    try {
      await fetch('/api/stocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
    } catch {
      setStocks(prev); // rollback
      setError('Failed to delete stock. Please try again.');
    }
  };

  // CRUD Operations for Transactions
  const addTransaction = async (transaction: Omit<Transaction, 'transactionId' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      if (res.ok) {
        const created: Transaction = await res.json();
        // Attach accountName for display
        const account = accounts.find((a) => a.accountId === created.accountId);
        setTransactions((prev) => [{ ...created, accountName: account?.name }, ...prev]);
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  };

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
    try {
      const existing = transactions.find((t) => t.transactionId === transactionId);
      if (!existing) return;
      const updated = { ...existing, ...updates };
      await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setTransactions((prev) => prev.map((t) => (t.transactionId === transactionId ? updated : t)));
    } catch (err) {
      console.error('Error updating transaction:', err);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      setTransactions((prev) => prev.filter((t) => t.transactionId !== transactionId));
    } catch (err) {
      console.error('Error deleting transaction:', err);
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

  // CRUD Operations for Budgets
  const addBudget = async (budget: Omit<Budget, 'budgetId' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget),
      });

      if (res.ok) {
        const newBudget: Budget = await res.json();
        setBudgets((prev) => [...prev, newBudget]);
      } else {
        // Optimistic local add when DynamoDB not configured
        const newBudget: Budget = {
          ...budget,
          budgetId: Date.now().toString(36) + Math.random().toString(36).substring(2),
          createdAt: new Date().toISOString(),
        };
        setBudgets((prev) => [...prev, newBudget]);
      }
    } catch (err) {
      console.error('Error adding budget:', err);
    }
  };

  const updateBudget = async (budgetId: string, updates: Partial<Budget>) => {
    try {
      await fetch('/api/budgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetId, ...updates }),
      });

      setBudgets((prev) => prev.map((b) => (b.budgetId === budgetId ? { ...b, ...updates } : b)));
    } catch (err) {
      console.error('Error updating budget:', err);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    try {
      await fetch('/api/budgets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetId }),
      });

      setBudgets((prev) => prev.filter((b) => b.budgetId !== budgetId));
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };

  return {
    // Data
    accounts,
    stocks,
    snapshots,
    transactions,
    currencyRates,
    totals,
    budgets,
    loading,
    error,
    baseCurrency,
    setBaseCurrency,
    clearError,

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

    // Transaction CRUD
    addTransaction,
    updateTransaction,
    deleteTransaction,

    // Budget CRUD
    addBudget,
    updateBudget,
    deleteBudget,
  };
}
