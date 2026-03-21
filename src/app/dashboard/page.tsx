'use client';

import { useState, useEffect } from 'react';
import { Stock, Account } from '@/types';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TrendingUpIcon } from 'lucide-react';
import { TabComponentProps } from '@/types/tab';
import { StockForm } from '@/components/stock/StockForm';
import { useVisibleTabs } from '@/components/DynamicTabs';
import { AccountForm } from '@/components/account/AccountForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialDataWithDynamo } from '@/hooks/useFinancialDataWithDynamo';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardPage() {
  const {
    accounts,
    stocks,
    totals,
    baseCurrency,
    setBaseCurrency,
    addAccount,
    updateAccount,
    deleteAccount,
    addStock,
    updateStock,
    deleteStock,
  } = useFinancialDataWithDynamo();

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
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

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

  const tabProps: TabComponentProps = {
    accounts,
    stocks,
    totals,
    baseCurrency,
    onCurrencyChange: setBaseCurrency,
    onEditAccount: handleEditAccount,
    onDeleteAccount: handleDeleteAccount,
    onEditStock: handleEditStock,
    onDeleteStock: handleDeleteStock,
    onAddAccount: handleAddAccount,
    onAddStock: handleAddStock,
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
                        : 'grid-cols-5'
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
        {(showAccountForm || showStockForm) && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 w-full h-full bg-black/50"
            onClick={() => {
              setShowAccountForm(false);
              setShowStockForm(false);
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
            </div>
          </div>
        )}
      </div>
    )
  );
}
