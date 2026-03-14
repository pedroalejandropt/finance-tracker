'use client';

import { useState, useEffect } from 'react';
import { Account, Stock, CurrencyRate, GlobalTotals } from '@/types';
import { StockAPI, CurrencyAPI } from '@/lib/api';
import { FinancialCalculator } from '@/lib/calculations';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// DynamoDB client — lazily created so missing env vars don't crash the module at load time
let _dynamoClient: DynamoDBClient | null = null;
function getDynamoClient(): DynamoDBClient {
  if (!_dynamoClient) {
    _dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _dynamoClient;
}

// Table names
const USERS_TABLE = process.env.AWS_DYNAMODB_USERS_TABLE || 'finance-tracker-users';
const ACCOUNTS_TABLE = process.env.AWS_DYNAMODB_ACCOUNTS_TABLE || 'finance-tracker-accounts';
const STOCKS_TABLE = process.env.AWS_DYNAMODB_STOCKS_TABLE || 'finance-tracker-stocks';
const RATES_TABLE = process.env.AWS_DYNAMODB_RATES_TABLE || 'finance-tracker-rates';

// DynamoDB types (for future implementation)

interface DynamoDBUser {
  userId: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export function useFinancialDataWithDynamo() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [totals, setTotals] = useState<GlobalTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  // Real DynamoDB operations
  const dynamoOperations = {
    // User operations
    getUser: async (userId: string): Promise<DynamoDBUser | null> => {
      try {
        const command = new GetItemCommand({
          TableName: USERS_TABLE,
          Key: marshall({
            userId: userId,
          }),
        });

        const response = await getDynamoClient().send(command);
        if (response.Item) {
          return unmarshall(response.Item) as DynamoDBUser;
        }
        return null;
      } catch (error) {
        console.error('Error getting user from DynamoDB:', error);
        throw error;
      }
    },

    createUser: async (
      user: Omit<DynamoDBUser, 'createdAt' | 'updatedAt'>
    ): Promise<DynamoDBUser> => {
      try {
        const now = new Date().toISOString();
        const newUser: DynamoDBUser = {
          ...user,
          createdAt: now,
          updatedAt: now,
        };

        const command = new PutItemCommand({
          TableName: USERS_TABLE,
          Item: marshall(newUser),
        });

        await getDynamoClient().send(command);
        return newUser;
      } catch (error) {
        console.error('Error creating user in DynamoDB:', error);
        throw error;
      }
    },

    updateUser: async (userId: string, updates: Partial<DynamoDBUser>): Promise<DynamoDBUser> => {
      try {
        const now = new Date().toISOString();

        // First get existing user
        const existingUser = await dynamoOperations.getUser(userId);
        if (!existingUser) {
          throw new Error('User not found');
        }

        const updatedUser: DynamoDBUser = {
          ...existingUser,
          ...updates,
          updatedAt: now,
        };

        const command = new UpdateItemCommand({
          TableName: USERS_TABLE,
          Key: marshall({ userId }),
          UpdateExpression: 'SET #name = :name, #email = :email, #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#name': 'name',
            '#email': 'email',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: marshall({
            ':name': updatedUser.name,
            ':email': updatedUser.email,
            ':updatedAt': now,
          }),
        });

        await getDynamoClient().send(command);
        return updatedUser;
      } catch (error) {
        console.error('Error updating user in DynamoDB:', error);
        throw error;
      }
    },

    // Account operations
    getAccounts: async (userId: string): Promise<Account[]> => {
      try {
        const command = new QueryCommand({
          TableName: ACCOUNTS_TABLE,
          // IndexName: 'userId', // GSI on userId
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: marshall({
            ':userId': userId,
          }),
        });

        const response = await getDynamoClient().send(command);
        if (response.Items) {
          return response.Items.map((item: any) => unmarshall(item) as Account);
        }
        return [];
      } catch (error) {
        console.error('Error getting accounts from DynamoDB:', error);
        throw error;
      }
    },

    saveAccount: async (userId: string, account: Account): Promise<void> => {
      try {
        const now = new Date().toISOString();
        const command = new PutItemCommand({
          TableName: ACCOUNTS_TABLE,
          Item: marshall({
            ...account,
            userId,
            createdAt: now,
            updatedAt: now,
          }),
        });

        await getDynamoClient().send(command);
      } catch (error) {
        console.error('Error saving account to DynamoDB:', error);
        throw error;
      }
    },

    deleteAccount: async (userId: string, accountId: string): Promise<void> => {
      try {
        const command = new DeleteItemCommand({
          TableName: ACCOUNTS_TABLE,
          Key: marshall({
            id: accountId,
            userId: userId,
          }),
        });

        await getDynamoClient().send(command);
      } catch (error) {
        console.error('Error deleting account from DynamoDB:', error);
        throw error;
      }
    },

    // Stock operations
    getStocks: async (userId: string): Promise<Stock[]> => {
      try {
        const command = new QueryCommand({
          TableName: STOCKS_TABLE,
          //   IndexName: 'userId', // GSI on userId
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: marshall({
            ':userId': userId,
          }),
        });

        const response = await getDynamoClient().send(command);
        if (response.Items) {
          return response.Items.map((item: any) => unmarshall(item) as Stock);
        }
        return [];
      } catch (error) {
        console.error('Error getting stocks from DynamoDB:', error);
        throw error;
      }
    },

    saveStock: async (userId: string, stock: Stock): Promise<void> => {
      try {
        const now = new Date().toISOString();
        const command = new PutItemCommand({
          TableName: STOCKS_TABLE,
          Item: marshall({
            ...stock,
            userId,
            createdAt: now,
            updatedAt: now,
          }),
        });

        await getDynamoClient().send(command);
      } catch (error) {
        console.error('Error saving stock to DynamoDB:', error);
        throw error;
      }
    },

    deleteStock: async (userId: string, stockId: string): Promise<void> => {
      try {
        const command = new DeleteItemCommand({
          TableName: STOCKS_TABLE,
          Key: marshall({
            symbol: stockId,
            userId: userId,
          }),
        });

        await getDynamoClient().send(command);
      } catch (error) {
        console.error('Error deleting stock from DynamoDB:', error);
        throw error;
      }
    },

    // Currency rates operations
    getCurrencyRates: async (from: string): Promise<CurrencyRate[]> => {
      try {
        const command = new QueryCommand({
          TableName: RATES_TABLE,
          KeyConditionExpression: '#from = :from',
          ExpressionAttributeNames: {
            '#from': 'from',
          },
          ExpressionAttributeValues: marshall({
            ':from': from,
          }),
        });

        const response = await getDynamoClient().send(command);
        if (response.Items) {
          return response.Items.map((item: any) => unmarshall(item) as CurrencyRate);
        }
        return [];
      } catch (error) {
        console.error('Error getting currency rates from DynamoDB:', error);
        // If table doesn't exist or query fails, return empty array
        return [];
      }
    },

    saveCurrencyRate: async (rate: CurrencyRate): Promise<void> => {
      try {
        const command = new PutItemCommand({
          TableName: RATES_TABLE,
          Item: marshall({
            from: rate.from,
            to: rate.to,
            rate: rate.rate,
            timestamp: rate.timestamp.toISOString(),
          }),
        });

        await getDynamoClient().send(command);
      } catch (error) {
        console.error('Error saving currency rate to DynamoDB:', error);
        // Don't throw error, just log it for now
      }
    },

    // Additional utility methods
    getAllUserData: async (userId: string): Promise<{ accounts: Account[]; stocks: Stock[] }> => {
      try {
        const [accounts, stocks] = await Promise.all([
          dynamoOperations.getAccounts(userId),
          dynamoOperations.getStocks(userId),
        ]);
        return { accounts, stocks };
      } catch (error) {
        console.error('Error getting all user data from DynamoDB:', error);
        throw error;
      }
    },

    // Batch operations for better performance
    batchSaveStocks: async (userId: string, stocks: Stock[]): Promise<void> => {
      try {
        // Save stocks in parallel for better performance
        await Promise.all(stocks.map((stock) => dynamoOperations.saveStock(userId, stock)));
      } catch (error) {
        console.error('Error batch saving stocks to DynamoDB:', error);
        throw error;
      }
    },
  };

  // Load initial data from DynamoDB
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // In a real implementation, you would:
        // 1. Get current user from session
        const userId = 'current-user'; // Would come from session

        // 2. Load user data from DynamoDB
        try {
          const { accounts, stocks } = await dynamoOperations.getAllUserData(userId);
          setAccounts(accounts);
          setStocks(stocks);
        } catch (error) {
          console.error('Error loading data from DynamoDB, using sample data:', error);
        }

        // Load currency rates
        try {
          const rates = await dynamoOperations.getCurrencyRates(baseCurrency);
          if (rates.length === 0) {
            // If no rates in DynamoDB, fetch from API and save
            const apiRates = await CurrencyAPI.getExchangeRates(baseCurrency);
            const currencyRateArray: CurrencyRate[] = Object.entries(apiRates.rates).map(
              ([to, rate]) => ({
                from: apiRates.base,
                to: to,
                rate,
                timestamp: new Date(),
              })
            );

            // Save rates to DynamoDB
            await Promise.all(
              currencyRateArray.map((rate) => dynamoOperations.saveCurrencyRate(rate))
            );

            setCurrencyRates(currencyRateArray);
          } else {
            setCurrencyRates(rates);
          }
        } catch (error) {
          console.error('Error loading currency rates:', error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [baseCurrency]);

  // Update stock prices with rate limiting
  const updateStockPrices = async () => {
    try {
      const updatedStocks = [...stocks];

      for (let i = 0; i < updatedStocks.length; i++) {
        const stock = updatedStocks[i];
        try {
          const quote = await StockAPI.getQuote(stock.symbol);
          updatedStocks[i] = { ...stock, currentPrice: quote.price };

          // Add delay to respect API rate limits (1 request per second)
          if (i < updatedStocks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Failed to update price for ${stock.symbol}:`, error);
        }
      }

      setStocks(updatedStocks);

      // Save updated stocks to DynamoDB
      const userId = 'current-user'; // Would come from session
      await dynamoOperations.batchSaveStocks(userId, updatedStocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock prices');
    }
  };

  // Calculate totals
  useEffect(() => {
    if ((accounts.length > 0 || stocks.length > 0, currencyRates.length > 0)) {
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

      // Save to DynamoDB (mock)
      const userId = 'current-user'; // Would come from session
      await dynamoOperations.saveAccount(userId, newAccount);

      setAccounts((prev) => [...prev, newAccount]);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      // Save to DynamoDB (mock)
      const userId = 'current-user'; // Would come from session
      const account = accounts.find((a) => a.accountId === id);
      if (account) {
        await dynamoOperations.saveAccount(userId, { ...account, ...updates });
      }

      setAccounts((prev) =>
        prev.map((account) => (account.accountId === id ? { ...account, ...updates } : account))
      );
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      // Delete from DynamoDB (mock)
      const userId = 'current-user'; // Would come from session
      await dynamoOperations.deleteAccount(userId, id);

      setAccounts((prev) => prev.filter((account) => account.accountId !== id));
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  // CRUD Operations for Stocks
  const addStock = async (stock: Stock) => {
    try {
      // Save to DynamoDB (mock)
      const userId = 'current-user'; // Would come from session
      await dynamoOperations.saveStock(userId, stock);
      setStocks((prev) => [...prev, stock]);
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const updateStock = async (symbol: string, updates: Partial<Stock>) => {
    try {
      // Save to DynamoDB (mock)
      const userId = 'current-user'; // Would come from session
      const stock = stocks.find((s) => s.symbol === symbol);
      if (stock) {
        await dynamoOperations.saveStock(userId, { ...stock, ...updates });
      }

      setStocks((prev) =>
        prev.map((stock) => (stock.symbol === symbol ? { ...stock, ...updates } : stock))
      );
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const deleteStock = async (symbol: string) => {
    try {
      // Delete from DynamoDB (mock)
      const userId = 'current-user'; // Would come from session
      await dynamoOperations.deleteStock(userId, symbol);
      setStocks((prev) => prev.filter((stock) => stock.symbol !== symbol));
    } catch (error) {
      console.error('Error deleting stock:', error);
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

    // DynamoDB operations (exposed for future use)
    dynamoOperations,
  };
}
