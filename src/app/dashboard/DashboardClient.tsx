'use client';

import { useState, useEffect } from 'react';
import { Stock, Account, Transaction, Budget } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TrendingUpIcon } from 'lucide-react';
import { TabComponentProps } from '@/types/tab';
import { StockForm } from '@/components/stock/StockForm';
import { useVisibleTabs } from '@/components/DynamicTabs';
import { AccountForm } from '@/components/account/AccountForm';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { BudgetForm } from '@/components/budget/BudgetForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialDataWithDynamo } from '@/hooks/useFinancialDataWithDynamo';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface DashboardClientProps {
  initialAccounts: Account[];
  initialStocks: Stock[];
}

export function DashboardClient({ initialAccounts, initialStocks }: DashboardClientProps) {
  const {
    accounts,
    stocks,
    snapshots,
    transactions,
    budgets,
    totals,
    baseCurrency,
    setBaseCurrency,
    addAccount,
    updateAccount,
    deleteAccount,
    addStock,
    updateStock,
    deleteStock,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useFinancialDataWithDynamo({ accounts: initialAccounts, stocks: initialStocks });

  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const [activeTab, setActiveTab] = useState('overview');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowAccountForm(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await deleteAccount(id);
    }
  };

  const handleAddStock = () => {
    setEditingStock(null);
    setShowStockForm(true);
  };

  const handleEditStock = (stock: Stock) => {
    setEditingStock(stock);
    setShowStockForm(true);
  };

  const handleDeleteStock = async (symbol: string) => {
    if (confirm('Are you sure you want to delete this stock?')) {
      await deleteStock(symbol);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(transactionId);
    }
  };

  const handleAddBudget = () => {
    setEditingBudget(null);
    setShowBudgetForm(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setShowBudgetForm(true);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(budgetId);
    }
  };

  const tabProps: TabComponentProps = {
    accounts,
    stocks,
    snapshots,
    transactions,
    budgets,
    totals,
    baseCurrency,
    onCurrencyChange: setBaseCurrency,
    onEditAccount: handleEditAccount,
    onDeleteAccount: handleDeleteAccount,
    onEditStock: handleEditStock,
    onDeleteStock: handleDeleteStock,
    onAddAccount: handleAddAccount,
    onAddStock: handleAddStock,
    onAddTransaction: handleAddTransaction,
    onEditTransaction: handleEditTransaction,
    onDeleteTransaction: handleDeleteTransaction,
    onAddBudget: handleAddBudget,
    onEditBudget: handleEditBudget,
    onDeleteBudget: handleDeleteBudget,
  };
  const visibleTabs = useVisibleTabs(tabProps);

  return (
    status === 'authenticated' && (
      <div className="min-h-screen relative">
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
          <ErrorBoundary>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList
                className={`grid w-full ${
                  visibleTabs.length === 2
                    ? 'grid-cols-2'
                    : visibleTabs.length === 3
                      ? 'grid-cols-3'
                      : visibleTabs.length === 4
                        ? 'grid-cols-4'
                        : visibleTabs.length === 5
                          ? 'grid-cols-5'
                          : 'grid-cols-6'
                }`}
              >
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center space-x-2"
                  >
                    <TrendingUpIcon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {visibleTabs.map((tab) => {
                const Component = tab.component;
                return (
                  <TabsContent key={tab.value} value={tab.value}>
                    <Component {...tabProps} />
                  </TabsContent>
                );
              })}
            </Tabs>
          </ErrorBoundary>
        </main>

        {/* Forms - Centered overlay */}
        {(showAccountForm || showStockForm || showTransactionForm || showBudgetForm) && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 w-full h-full bg-black/50"
            onClick={() => {
              setShowAccountForm(false);
              setShowStockForm(false);
              setShowTransactionForm(false);
              setShowBudgetForm(false);
            }}
          >
            <div className="shadow-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              {showAccountForm && (
                <AccountForm
                  account={editingAccount || undefined}
                  onSubmit={async (account) => {
                    if (editingAccount) {
                      await updateAccount(editingAccount.accountId, account);
                    } else {
                      await addAccount(account);
                    }
                    setShowAccountForm(false);
                  }}
                  onCancel={() => setShowAccountForm(false)}
                />
              )}

              {showStockForm && (
                <StockForm
                  stock={editingStock || undefined}
                  onSubmit={async (stock) => {
                    if (editingStock) {
                      await updateStock(editingStock.symbol, stock);
                    } else {
                      await addStock(stock);
                    }
                    setShowStockForm(false);
                  }}
                  onCancel={() => setShowStockForm(false)}
                />
              )}

              {showTransactionForm && (
                <TransactionForm
                  transaction={editingTransaction || undefined}
                  accounts={accounts}
                  onSubmit={async (transaction) => {
                    if (editingTransaction) {
                      await updateTransaction(editingTransaction.transactionId, transaction);
                    } else {
                      await addTransaction(transaction);
                    }
                    setShowTransactionForm(false);
                  }}
                  onCancel={() => setShowTransactionForm(false)}
                />
              )}

              {showBudgetForm && (
                <BudgetForm
                  budget={editingBudget || undefined}
                  onSubmit={async (budget) => {
                    if (editingBudget) {
                      await updateBudget(editingBudget.budgetId, budget);
                    } else {
                      await addBudget(budget);
                    }
                    setShowBudgetForm(false);
                  }}
                  onCancel={() => setShowBudgetForm(false)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    )
  );
}
