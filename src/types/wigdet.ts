import { GlobalTotals } from '.';

export interface WidgetConfig {
  key: string;
  label: string;
  width: string;
  component: React.FC<WidgetComponentProps>;
}

export interface WidgetComponentProps {
  totals?: GlobalTotals | null;
  previousTotal?: number;
  baseCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}
