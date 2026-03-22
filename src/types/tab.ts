import { ReactNode } from 'react';
import { Account, Stock, GlobalTotals, NetWorthSnapshot, Transaction, Budget } from './index';

export interface TabConfig {
  value: string;
  label: string;
  icon?: ReactNode;
  component: React.ComponentType<TabComponentProps>;
  showCondition?: (props: TabComponentProps) => boolean;
}

export interface TabComponentProps {
  accounts?: Account[];
  stocks?: Stock[];
  snapshots?: NetWorthSnapshot[];
  transactions?: Transaction[];
  totals?: GlobalTotals | null;
  baseCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  onEditAccount?: (account: Account) => void;
  onDeleteAccount?: (id: string) => void;
  onEditStock?: (stock: Stock) => void;
  onDeleteStock?: (symbol: string) => void;
  onAddAccount?: () => void;
  onAddStock?: () => void;
  onAddTransaction?: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  budgets?: Budget[];
  onAddBudget?: () => void;
  onEditBudget?: (budget: Budget) => void;
  onDeleteBudget?: (budgetId: string) => void;
}
