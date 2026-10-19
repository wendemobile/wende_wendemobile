'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Receipt, Calendar, Wallet, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

const EXPENSE_CATEGORIES = [
  'Rent', 'Utilities', 'Salaries', 'Supplies', 'Transportation',
  'Marketing', 'Maintenance', 'Insurance', 'Taxes', 'Other'
];

export default function NewExpensePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Other',
    payee: '',
    description: '',
    paymentMethod: 'CASH',
    bankAccountId: '',
    reference: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      return data.data || [];
    },
  });

  // Fetch current cash in hand for validation display
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-cash'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      return data.data?.sessionFinancials || null;
    },
  });

  const availableCash = dashboardData?.cashInHand || 0;
  const hasActiveSession = dashboardData?.hasActiveSession || false;
  const enteredAmount = parseFloat(formData.amount) || 0;
  const exceedsCash = formData.paymentMethod === 'CASH' && enteredAmount > availableCash;

  const [error, setError] = useState<string | null>(null);

  const createExpense = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to create expense');
      }
      return result;
    },
    onSuccess: () => {
      router.push('/expenses');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      bankAccountId: formData.bankAccountId || undefined,
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/expenses">
          <Button variant="ghost" size="icon" className="touch-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add Expense</h1>
          <p className="text-sm text-muted-foreground">Record business expense</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount & Date */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Expense Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date *</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payee">Payee</Label>
                <Input
                  id="payee"
                  value={formData.payee}
                  onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-secondary border-border"
                placeholder="What was this expense for?"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Method *</Label>
              <select
                id="paymentMethod"
                className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="MOBILE_TRANSFER">Mobile Transfer</option>
                <option value="CARD">Card</option>
              </select>
            </div>

            {/* Cash Balance Info */}
            {formData.paymentMethod === 'CASH' && (
              <div className={`p-3 rounded-xl border ${exceedsCash ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available Cash:</span>
                  <span className={`font-bold ${exceedsCash ? 'text-red-500' : 'text-emerald-500'}`}>
                    {formatCurrency(availableCash)}
                  </span>
                </div>
                {!hasActiveSession && (
                  <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No active session - please open a session first
                  </p>
                )}
                {exceedsCash && hasActiveSession && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Expense amount exceeds available cash
                  </p>
                )}
              </div>
            )}

            {formData.paymentMethod === 'MOBILE_TRANSFER' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountId">Bank Account</Label>
                  <select
                    id="bankAccountId"
                    className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                  >
                    <option value="">Select Account</option>
                    {bankAccounts?.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="bg-secondary border-border"
                    placeholder="Transaction reference"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mobile-card border-destructive bg-destructive/10">
            <CardContent className="p-3">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/expenses" className="flex-1">
            <Button type="button" variant="outline" className="w-full touch-btn">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="flex-1 gradient-primary glow-sm touch-btn"
            disabled={createExpense.isPending || (formData.paymentMethod === 'CASH' && (exceedsCash || !hasActiveSession))}
          >
            {createExpense.isPending ? 'Creating...' : 'Create Expense'}
          </Button>
        </div>
      </form>
    </div>
  );
}
