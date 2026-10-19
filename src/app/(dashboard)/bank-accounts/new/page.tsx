'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2, User, CreditCard, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function NewBankAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    holderName: '',
    bankName: '',
    accountNumber: '',
    initialBalance: '0',
  });
  const [error, setError] = useState<string | null>(null);

  const createAccount = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to create account');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      router.push('/bank-accounts');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createAccount.mutate({
      ...formData,
      initialBalance: parseFloat(formData.initialBalance) || 0,
    });
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/bank-accounts">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Add Bank Account</h1>
          <p className="text-sm text-muted-foreground">Add a new bank or mobile money account</p>
        </div>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
            
            {/* Account Holder */}
            <div className="space-y-2">
              <Label htmlFor="holderName" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Account Holder Name *
              </Label>
              <Input
                id="holderName"
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                placeholder="Enter account holder name"
                required
              />
            </div>

            {/* Bank Name & Account Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName" className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Bank Name *
                </Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., Chase, Wells Fargo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  Account Number *
                </Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  required
                />
              </div>
            </div>

            {/* Initial Balance */}
            <div className="space-y-2">
              <Label htmlFor="initialBalance" className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Initial Balance
              </Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                placeholder="0.00"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={createAccount.isPending}
                className="flex-1 gradient-primary"
              >
                {createAccount.isPending ? 'Creating...' : 'Create Account'}
              </Button>
              <Link href="/bank-accounts" className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
