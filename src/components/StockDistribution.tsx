'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomPieChart, CustomTreemap } from '@/components/charts';
import { Stock } from '@/types';
import { FinancialCalculator } from '@/lib/calculations';
import { TrendingUpIcon, BarChart3Icon } from 'lucide-react';
import { useFinancialDataWithDynamo } from '@/hooks/useFinancialDataWithDynamo';
import { AsyncErrorBoundary } from '@/components/AsyncErrorBoundary';

interface StockDistributionProps {
  stocks: Stock[];
  baseCurrency?: string;
}

export function StockDistribution({ stocks, baseCurrency = 'USD' }: StockDistributionProps) {
  const [activeTab, setActiveTab] = useState('pie');
  const { currencyRates } = useFinancialDataWithDynamo();

  // Group stocks by currency
  const stocksByCurrency = stocks.reduce(
    (acc, stock) => {
      const currency = stock.currency || 'USD';
      const totalValue = stock.shares * stock.currentPrice;

      if (!acc[currency]) {
        acc[currency] = {
          currency,
          totalValue: 0,
          stocks: [],
        };
      }

      acc[currency].totalValue += totalValue;
      acc[currency].stocks.push({
        ...stock,
        totalValue,
      });

      return acc;
    },
    {} as Record<
      string,
      { currency: string; totalValue: number; stocks: (Stock & { totalValue: number })[] }
    >
  );

  // Prepare data for currency distribution pie chart
  const currencyData = Object.values(stocksByCurrency).map((item) => ({
    name: item.currency,
    value: item.totalValue,
    currency: item.currency,
    percentage:
      (item.totalValue /
        stocks.reduce((sum, stock) => sum + stock.shares * stock.currentPrice, 0)) *
      100,
  }));

  // Prepare data for individual stock treemap
  const stockTreemapData = stocks.map((stock) => ({
    name: stock.symbol,
    size: stock.shares * stock.currentPrice,
    currency: stock.currency || 'USD',
    percentage: 0,
  }));

  // Prepare data for stock type distribution (Stocks vs ETFs)
  const stockTypeData = stocks.reduce(
    (acc, stock) => {
      const type = stock.type.toUpperCase();
      // include exchange calculation
      const totalValue =
        stock.shares *
        stock.currentPrice *
        FinancialCalculator.getExchangeRate(currencyRates, stock.currency || 'USD', baseCurrency);

      const existingType = acc.find((item) => item.name === type);
      if (existingType) {
        existingType.value += totalValue;
      } else {
        acc.push({
          name: type,
          value: totalValue,
          currency: baseCurrency,
          percentage: 0,
        });
      }

      return acc;
    },
    [] as { name: string; value: number; currency: string; percentage: number }[]
  );

  const stocksData = stocks.reduce(
    (acc, stock) => {
      // include exchange calculation
      const totalValue =
        stock.shares *
        stock.currentPrice *
        FinancialCalculator.getExchangeRate(currencyRates, stock.currency || 'USD', baseCurrency);

      acc.push({
        name: stock.symbol,
        value: totalValue,
        currency: baseCurrency,
        percentage: 0,
      });
      return acc;
    },
    [] as { name: string; value: number; currency: string; percentage: number }[]
  );

  // Calculate percentages for stock types
  const totalStockValue = stocks.reduce((sum, stock) => sum + stock.shares * stock.currentPrice, 0);
  stockTypeData.forEach((item) => {
    item.percentage = (item.value / totalStockValue) * 100;
  });

  stocksData.forEach((item) => {
    item.percentage = (item.value / totalStockValue) * 100;
  });

  stockTreemapData.forEach((item) => {
    item.percentage = +((item.size / totalStockValue) * 100).toFixed(0);
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUpIcon className="h-5 w-5" />
          <span>Stock Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AsyncErrorBoundary message="Chart failed to load">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pie" className="flex items-center space-x-2">
                <TrendingUpIcon className="h-4 w-4" />
                <span>By Currency</span>
              </TabsTrigger>
              <TabsTrigger value="treemap" className="flex items-center space-x-2">
                <BarChart3Icon className="h-4 w-4" />
                <span>Treemap</span>
              </TabsTrigger>
              <TabsTrigger value="type" className="flex items-center space-x-2">
                <TrendingUpIcon className="h-4 w-4" />
                <span>Stocks vs ETFs</span>
              </TabsTrigger>
              <TabsTrigger value="stocks" className="flex items-center space-x-2">
                <TrendingUpIcon className="h-4 w-4" />
                <span>Stocks</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pie" className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Distribution of stock portfolio by currency
              </div>
              <CustomPieChart
                data={currencyData}
                colors={COLORS}
                height={300}
                showLegend={true}
                formatCurrency={(value, currency) =>
                  FinancialCalculator.formatCurrency(value, currency || baseCurrency)
                }
              />
            </TabsContent>

            <TabsContent value="treemap" className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Individual stock values (size represents total value)
              </div>
              <CustomTreemap
                data={stockTreemapData}
                colors={COLORS}
                height={400}
                baseCurrency={baseCurrency}
                formatCurrency={(value, currency) =>
                  FinancialCalculator.formatCurrency(value, currency || baseCurrency)
                }
              />
            </TabsContent>

            <TabsContent value="type" className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Distribution between individual stocks and ETFs
              </div>
              <CustomPieChart
                data={stockTypeData}
                colors={['#0088FE', '#00C49F']}
                height={300}
                showLegend={true}
                baseCurrency={baseCurrency}
                formatCurrency={(value, currency) =>
                  FinancialCalculator.formatCurrency(value, currency || baseCurrency)
                }
              />
            </TabsContent>

            <TabsContent value="stocks" className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Distribution between individual stocks and ETFs
              </div>
              <CustomPieChart
                data={stocksData}
                colors={[
                  '#0088FE',
                  '#00C49F',
                  '#FFBB28',
                  '#FF8042',
                  '#8884D8',
                  '#82CA9D',
                  '#9f82caff',
                  '#ca8282ff',
                  '#c5ca82ff',
                ]}
                height={300}
                showLegend={true}
                baseCurrency={baseCurrency}
                formatCurrency={(value, currency) =>
                  FinancialCalculator.formatCurrency(value, currency || baseCurrency)
                }
              />
            </TabsContent>
          </Tabs>
        </AsyncErrorBoundary>
      </CardContent>
    </Card>
  );
}
