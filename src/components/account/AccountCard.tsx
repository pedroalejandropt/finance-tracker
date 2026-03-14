'use client';

import { Account } from '@/types';
import { FinancialCalculator } from '@/lib/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BanknoteIcon, TrendingUpIcon, WalletIcon, EditIcon, TrashIcon } from 'lucide-react';

interface AccountCardProps {
  account: Account;
  totalInUSD?: number;
  onEdit?: (account: Account) => void;
  onDelete?: (accountId: string) => void;
}

export function AccountCard({ account, totalInUSD, onEdit, onDelete }: AccountCardProps) {
  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'bank':
        return <BanknoteIcon className="h-5 w-5" />;
      case 'investment':
        return <TrendingUpIcon className="h-5 w-5" />;
      case 'crypto':
        return <WalletIcon className="h-5 w-5" />;
      default:
        return <BanknoteIcon className="h-5 w-5" />;
    }
  };

  const getAccountTypeColor = (type: Account['type']) => {
    switch (type) {
      case 'bank':
        return 'bg-blue-100 text-blue-800';
      case 'investment':
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getAccountIcon(account.type)}
            <CardTitle className="text-lg">{account.name}</CardTitle>
          </div>
          <Badge className={getAccountTypeColor(account.type)}>{account.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-600">Balance:</span>
            <span className="text-xl font-bold">
              {FinancialCalculator.formatCurrency(account.balance, account.currency)}
            </span>
          </div>
          {totalInUSD && (
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600">USD Value:</span>
              <span className="text-sm font-medium text-gray-700">
                {FinancialCalculator.formatCurrency(totalInUSD, 'USD')}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Currency:</span>
            <span className="text-sm font-medium">{account.currency}</span>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex space-x-2 pt-2 border-t">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(account)}
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
                onClick={() => onDelete(account.accountId)}
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
