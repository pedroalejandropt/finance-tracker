'use client';

import { Stock } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FinancialCalculator } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, EditIcon, TrashIcon } from 'lucide-react';

interface StockCardProps {
  stock: Stock;
  previousPrice?: number;
  onEdit?: (stock: Stock) => void;
  onDelete?: (symbol: string) => void;
}

export function StockCard({ stock, previousPrice, onEdit, onDelete }: StockCardProps) {
  const totalValue = stock.shares * stock.currentPrice;
  const change = previousPrice ? stock.currentPrice - previousPrice : 0;
  const changePercent = previousPrice ? (change / previousPrice) * 100 : 0;

  const getChangeIcon = () => {
    if (change > 0) return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
    return <MinusIcon className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = () => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getInvestmentColor = (type: Stock['type']) => {
    switch (type) {
      case 'stock':
        return 'bg-blue-100 text-blue-800';
      case 'etf':
        return 'bg-green-100 text-green-800';
      case 'crypto':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{stock.symbol}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stock.currency}</Badge>
            <Badge className={getInvestmentColor(stock.type)}>{stock.type.toUpperCase()}</Badge>
          </div>
        </div>
        <p className="text-sm text-gray-600">{stock.name}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-600">Shares:</span>
            <span className="font-medium">{stock.shares.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-600">Price:</span>
            <span className="font-bold">
              {FinancialCalculator.formatCurrency(stock.currentPrice, stock.currency)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-600">Total Value:</span>
            <span className="text-lg font-bold">
              {FinancialCalculator.formatCurrency(totalValue, stock.currency)}
            </span>
          </div>
          {previousPrice && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Change:</span>
              <div className="flex items-center space-x-1">
                {getChangeIcon()}
                <span className={`text-sm font-medium ${getChangeColor()}`}>
                  {FinancialCalculator.formatCurrency(change, stock.currency)}(
                  {changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex space-x-2 pt-2 border-t">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(stock)} className="flex-1">
                <EditIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(stock.symbol)}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
