import { Button } from './ui/button';
import { PlusIcon } from 'lucide-react';
import { TotalSummary } from '@/components/TotalSummary';
import { StockCard } from '@/components/stock/StockCard';
import { TabConfig, TabComponentProps } from '@/types/tab';
import { AccountCard } from '@/components/account/AccountCard';
import { StockDistribution } from '@/components/StockDistribution';

// Componentes dinámicos para cada tab
const OverviewTab: React.FC<TabComponentProps> = ({
  totals,
  stocks = [],
  baseCurrency,
  onCurrencyChange
}) => (
  <div className="space-y-6">
    {totals && (
      <TotalSummary
        totals={totals}
        baseCurrency={baseCurrency}
        onCurrencyChange={onCurrencyChange}
      />
    )}
    {stocks.length > 0 && (
      <StockDistribution
        stocks={stocks}
        baseCurrency={baseCurrency}
      />
    )}
  </div>
);

const AccountsTab: React.FC<TabComponentProps> = ({
  accounts = [],
  totals,
  onEditAccount,
  onDeleteAccount,
  onAddAccount
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Accounts</h2>
      {onAddAccount && (
        <Button variant="outline" onClick={onAddAccount} className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg">
          <PlusIcon className="h-4 w-4" />
          <span>Add Account</span>
        </Button>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <AccountCard
          key={account.accountId}
          account={account}
          totalInUSD={totals?.totalsByCurrency.find(
            total => total.currency === account.currency
          )?.totalInUSD || 0}
          onEdit={onEditAccount}
          onDelete={onDeleteAccount}
        />
      ))}
    </div>
  </div>
);

const StocksTab: React.FC<TabComponentProps> = ({
  stocks = [],
  onEditStock,
  onDeleteStock,
  onAddStock
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Stock Portfolio</h2>
      {onAddStock && (
        <Button variant="outline" onClick={onAddStock} className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg">
          <PlusIcon className="h-4 w-4" />
          <span>Add Stock</span>
        </Button>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stocks.map((stock) => (
        <StockCard
          key={stock.symbol}
          stock={stock}
          onEdit={onEditStock}
          onDelete={onDeleteStock}
        />
      ))}
    </div>
  </div>
);

const StockAnalysisTab: React.FC<TabComponentProps> = ({
  stocks = [],
  baseCurrency
}) => (
  <div className="space-y-6">
    {stocks.length > 0 ? (
      <StockDistribution
        stocks={stocks}
        baseCurrency={baseCurrency}
      />
    ) : (
      <div className="text-center py-12">
        <p className="text-gray-500">No stocks available for analysis</p>
      </div>
    )}
  </div>
);

// Configuración de tabs dinámica
export const getTabConfigs = (): TabConfig[] => [
  {
    value: 'overview',
    label: 'Overview',
    component: OverviewTab
  },
  {
    value: 'accounts',
    label: 'Accounts',
    component: AccountsTab,
    // showCondition: (props) => Boolean(props.accounts && props.accounts.length > 0)
  },
  {
    value: 'stocks',
    label: 'Stocks',
    component: StocksTab,
    // showCondition: (props) => Boolean(props.stocks && props.stocks.length > 0)
  },
  // {
  //   value: 'stock-distribution',
  //   label: 'Stock Analysis',
  //   component: StockAnalysisTab,
  //   showCondition: (props) => Boolean(props.stocks && props.stocks.length > 0)
  // }
];

// Hook para filtrar tabs basado en condiciones
export const useVisibleTabs = (props: TabComponentProps): TabConfig[] => {
  const allTabs = getTabConfigs();
  
  return allTabs.filter(tab => 
    !tab.showCondition || tab.showCondition(props)
  );
};
