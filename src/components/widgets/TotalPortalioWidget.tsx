import { currencies } from '@/lib/currency';
import { WidgetComponentProps } from '@/types/wigdet';
import { FinancialCalculator } from '@/lib/calculations';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export const TotalPortafolioWidget: React.FC<WidgetComponentProps> = ({
  totals,
  previousTotal,
  baseCurrency,
  onCurrencyChange,
}) => {
  const { change, changePercent } = previousTotal
    ? FinancialCalculator.calculatePortfolioChange(totals!.totalUSD, previousTotal)
    : { change: 0, changePercent: 0 };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {FinancialCalculator.formatCurrency(totals!.totalUSD, baseCurrency!)}
        </div>
        {onCurrencyChange && (
          <Select value={baseCurrency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {previousTotal && (
        <div
          className={`flex items-center space-x-1 ${
            change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {change >= 0 ? (
            <TrendingUpIcon className="h-4 w-4" />
          ) : (
            <TrendingDownIcon className="h-4 w-4" />
          )}
          <span className="font-medium">
            {FinancialCalculator.formatCurrency(Math.abs(change), baseCurrency!)}(
            {changePercent >= 0 ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  );
};
