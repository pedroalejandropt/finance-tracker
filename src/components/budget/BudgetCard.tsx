'use client';

import { Budget } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditIcon, TrashIcon } from 'lucide-react';
import { FinancialCalculator } from '@/lib/calculations';

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
}

export function BudgetCard({ budget, spent, onEdit, onDelete }: BudgetCardProps) {
  const percentage = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;

  const getProgressColor = () => {
    const ratio = budget.limit > 0 ? spent / budget.limit : 0;
    if (ratio >= 1) return 'bg-red-500';
    if (ratio >= 0.75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      salary: 'bg-green-100 text-green-800',
      investment: 'bg-blue-100 text-blue-800',
      food: 'bg-orange-100 text-orange-800',
      transport: 'bg-cyan-100 text-cyan-800',
      housing: 'bg-purple-100 text-purple-800',
      health: 'bg-red-100 text-red-800',
      entertainment: 'bg-pink-100 text-pink-800',
      shopping: 'bg-yellow-100 text-yellow-800',
      transfer: 'bg-gray-100 text-gray-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{budget.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={getCategoryColor(budget.category)}>{budget.category}</Badge>
            <Badge variant="outline">{budget.period}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-600">Limit:</span>
            <span className="text-xl font-bold">
              {FinancialCalculator.formatCurrency(budget.limit, budget.currency)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {FinancialCalculator.formatCurrency(spent, budget.currency)} /{' '}
                {FinancialCalculator.formatCurrency(budget.limit, budget.currency)}
              </span>
              <span>{Math.round(percentage)}%</span>
            </div>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex space-x-2 pt-2 border-t">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(budget)}
                  className="flex-1"
                >
                  <EditIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(budget.budgetId)}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
