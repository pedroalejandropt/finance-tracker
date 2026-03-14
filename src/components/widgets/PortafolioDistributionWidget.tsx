import { FinancialCalculator } from "@/lib/calculations";
import { CustomPieChart, DEFAULT_COLORS } from "../charts";
import { WidgetComponentProps } from "@/types/wigdet";


export const PortafolioDistributionWidget: React.FC<WidgetComponentProps> = ({ totals, baseCurrency }) => {
    const pieData = totals!.totalsByCurrency.map((total: any) => ({
        name: total.currency,
        value: total.totalInUSD,
        percentage: (total.totalInUSD / totals!.totalUSD) * 100
    }));

    return (
        <CustomPieChart
            data={pieData}
            colors={DEFAULT_COLORS}
            height={256}
            showLegend={false}
            baseCurrency={baseCurrency}
            formatCurrency={(value, currency) => FinancialCalculator.formatCurrency(value, currency! || baseCurrency!)}
        />);
};