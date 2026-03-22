import React from 'react';
import { Button } from './ui/button';
import { PlusIcon } from 'lucide-react';
import { TotalSummary } from '@/components/TotalSummary';
import { StockCard } from '@/components/stock/StockCard';
import { TabConfig, TabComponentProps } from '@/types/tab';
import { AccountCard } from '@/components/account/AccountCard';
import { StockDistribution } from '@/components/StockDistribution';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import { NetWorthChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUpIcon } from 'lucide-react';
import { TransactionList } from '@/components/transaction/TransactionList';
import { BudgetCard } from '@/components/budget/BudgetCard';

const PAGE_SIZE = 6;

// Componentes dinámicos para cada tab
const OverviewTab: React.FC<TabComponentProps> = ({
  totals,
  stocks = [],
  snapshots = [],
  baseCurrency,
  onCurrencyChange,
}) => (
  <div className="space-y-6">
    {totals && (
      <TotalSummary
        totals={totals}
        baseCurrency={baseCurrency}
        onCurrencyChange={onCurrencyChange}
      />
    )}
    {snapshots.length >= 1 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUpIcon className="h-5 w-5" />
            <span>Net Worth Over Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NetWorthChart snapshots={snapshots} baseCurrency={baseCurrency} height={240} />
        </CardContent>
      </Card>
    )}
    {stocks.length > 0 && <StockDistribution stocks={stocks} baseCurrency={baseCurrency} />}
  </div>
);

const AccountsTab: React.FC<TabComponentProps> = ({
  accounts = [],
  totals,
  onEditAccount,
  onDeleteAccount,
  onAddAccount,
}) => {
  const { currentPage, totalPages, paginatedItems, setPage } = usePagination(accounts, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Accounts</h2>
        {onAddAccount && (
          <Button
            variant="outline"
            onClick={onAddAccount}
            className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Account</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedItems.map((account) => (
          <AccountCard
            key={account.accountId}
            account={account}
            totalInUSD={
              totals?.totalsByCurrency.find((total) => total.currency === account.currency)
                ?.totalInUSD || 0
            }
            onEdit={onEditAccount}
            onDelete={onDeleteAccount}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
};

const StocksTab: React.FC<TabComponentProps> = ({
  stocks = [],
  onEditStock,
  onDeleteStock,
  onAddStock,
}) => {
  const { currentPage, totalPages, paginatedItems, setPage } = usePagination(stocks, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Stock Portfolio</h2>
        {onAddStock && (
          <Button
            variant="outline"
            onClick={onAddStock}
            className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Stock</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedItems.map((stock) => (
          <StockCard
            key={stock.symbol}
            stock={stock}
            onEdit={onEditStock}
            onDelete={onDeleteStock}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
};

function withErrorBoundary(Component: React.FC<TabComponentProps>): React.FC<TabComponentProps> {
  const WrappedComponent: React.FC<TabComponentProps> = (props) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
  WrappedComponent.displayName = `WithErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

const TransactionsTab: React.FC<TabComponentProps> = ({
  transactions = [],
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Transaction History</h2>
      {onAddTransaction && (
        <Button
          variant="outline"
          onClick={onAddTransaction}
          className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Transaction</span>
        </Button>
      )}
    </div>

    <TransactionList
      transactions={transactions}
      onEdit={onEditTransaction}
      onDelete={onDeleteTransaction}
    />
  </div>
);

const BudgetsTab: React.FC<TabComponentProps> = ({
  budgets = [],
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Budgets</h2>
      {onAddBudget && (
        <Button
          variant="outline"
          onClick={onAddBudget}
          className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Budget</span>
        </Button>
      )}
    </div>

    {budgets.length === 0 ? (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No budgets yet.</p>
        <p className="text-sm mt-1">Click &quot;Add Budget&quot; to create your first budget.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.budgetId}
            budget={budget}
            spent={0}
            onEdit={onEditBudget}
            onDelete={onDeleteBudget}
          />
        ))}
      </div>
    )}
  </div>
);

// Configuración de tabs dinámica
export const getTabConfigs = (): TabConfig[] => [
  {
    value: 'overview',
    label: 'Overview',
    component: withErrorBoundary(OverviewTab),
  },
  {
    value: 'accounts',
    label: 'Accounts',
    component: withErrorBoundary(AccountsTab),
    // showCondition: (props) => Boolean(props.accounts && props.accounts.length > 0)
  },
  {
    value: 'stocks',
    label: 'Stocks',
    component: withErrorBoundary(StocksTab),
    // showCondition: (props) => Boolean(props.stocks && props.stocks.length > 0)
  },
  {
    value: 'transactions',
    label: 'Transactions',
    component: TransactionsTab,
  },
  {
    value: 'budgets',
    label: 'Budgets',
    component: BudgetsTab,
  },
];

// Hook para filtrar tabs basado en condiciones
export const useVisibleTabs = (props: TabComponentProps): TabConfig[] => {
  const allTabs = getTabConfigs();

  return allTabs.filter((tab) => !tab.showCondition || tab.showCondition(props));
};
