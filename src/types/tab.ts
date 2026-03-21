import { ReactNode } from 'react';
import { Account, Stock, GlobalTotals, NetWorthSnapshot } from './index';

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
  totals?: GlobalTotals | null;
  baseCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  onEditAccount?: (account: Account) => void;
  onDeleteAccount?: (id: string) => void;
  onEditStock?: (stock: Stock) => void;
  onDeleteStock?: (symbol: string) => void;
  onAddAccount?: () => void;
  onAddStock?: () => void;
}
