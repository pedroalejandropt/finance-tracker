import { FinancialCalculator } from "@/lib/calculations";
import { DEFAULT_COLORS } from "../charts";
import { WidgetComponentProps } from "@/types/wigdet";


export const CurrenciesWidget: React.FC<WidgetComponentProps> = ({ totals, baseCurrency }) => {
    return (
        <div className="space-y-2">
            {totals!.totalsByCurrency.map((total: any, index: any) => (
                <div key={total.currency} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                        />
                        <span className="font-medium">{total.currency}</span>
                    </div>
                    <div className="text-right">
                        <div className="font-medium">
                            {FinancialCalculator.formatCurrency(total.totalInUSD, baseCurrency!)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {FinancialCalculator.formatCurrency(total.totalInCurrency, total.currency)}
                        </div>
                    </div>
                </div>
            ))}
        </div>);
};