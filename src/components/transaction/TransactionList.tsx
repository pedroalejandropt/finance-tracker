'use client';

import { Transaction } from '@/types';
import { FinancialCalculator } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightLeftIcon,
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

const TYPE_CONFIG = {
  income: {
    icon: ArrowUpIcon,
    className: 'text-green-600',
    badgeVariant: 'default' as const,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  expense: {
    icon: ArrowDownIcon,
    className: 'text-red-600',
    badgeVariant: 'destructive' as const,
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  transfer: {
    icon: ArrowRightLeftIcon,
    className: 'text-blue-600',
    badgeVariant: 'secondary' as const,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No transactions yet. Add your first transaction to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const config = TYPE_CONFIG[tx.type];
        const Icon = config.icon;
        const amountSign = tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : '';

        return (
          <Card key={tx.transactionId} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-muted ${config.className}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{tx.description}</span>
                    <Badge className={`text-xs ${config.badgeClass}`}>{tx.category}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(tx.date)}
                    {tx.accountName && ` · ${tx.accountName}`}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className={`font-semibold ${config.className}`}>
                    {amountSign}
                    {FinancialCalculator.formatCurrency(tx.amount, tx.currency)}
                  </div>
                </div>

                {(onEdit || onDelete) && (
                  <div className="flex-shrink-0 flex gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(tx)}
                        className="h-8 w-8 p-0"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(tx.transactionId)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
