'use client';

import { useState } from 'react';
import { Account, Transaction, TransactionCategory, TransactionType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XIcon } from 'lucide-react';

interface TransactionFormProps {
  transaction?: Transaction;
  accounts: Account[];
  onSubmit: (transaction: Omit<Transaction, 'transactionId' | 'createdAt'>) => void;
  onCancel: () => void;
}

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

const CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'salary', label: 'Salary' },
  { value: 'investment', label: 'Investment' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transport' },
  { value: 'housing', label: 'Housing' },
  { value: 'health', label: 'Health' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'other', label: 'Other' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

export function TransactionForm({
  transaction,
  accounts,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    accountId: transaction?.accountId || accounts[0]?.accountId || '',
    type: transaction?.type || ('expense' as TransactionType),
    category: transaction?.category || ('other' as TransactionCategory),
    amount: transaction?.amount || 0,
    currency: transaction?.currency || accounts[0]?.currency || 'USD',
    description: transaction?.description || '',
    date: transaction?.date || today,
  });

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((a) => a.accountId === accountId);
    setFormData({
      ...formData,
      accountId,
      currency: account?.currency || formData.currency,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</CardTitle>
            <CardDescription>
              {transaction ? 'Update transaction details' : 'Record a new transaction'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select value={formData.accountId} onValueChange={handleAccountChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.accountId} value={account.accountId}>
                    {account.name} ({account.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: TransactionType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: TransactionCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Monthly rent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" className="flex-1">
              {transaction ? 'Update Transaction' : 'Add Transaction'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
