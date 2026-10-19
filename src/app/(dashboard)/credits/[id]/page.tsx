'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, CreditCard, User, Calendar, DollarSign, Plus, X, Banknote, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function CreditDetailPage({ params }: { params: { id: string } }) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'CASH', bankAccountId: '', reference: '' });
  const queryClient = useQueryClient();

  const { data: credit, isLoading } = useQuery({
    queryKey: ['credit', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/credits/${params.id}`);
      const data = await res.json();
      return data.data;
    },
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      return data.data || [];
    },
  });

  const makePayment = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/credits/${params.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to make payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit', params.id] });
      setShowPayment(false);
      setPaymentData({ amount: '', method: 'CASH', bankAccountId: '', reference: '' });
    },
  });

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    makePayment.mutate({
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.method,
      bankAccountId: paymentData.bankAccountId || undefined,
      reference: paymentData.reference || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!credit) {
    return <div className="text-center py-12 text-muted-foreground">Credit not found</div>;
  }

  const balance = parseFloat(credit.balance);
  const principal = parseFloat(credit.principal);
  const paid = principal - balance;
  const progress = principal > 0 ? (paid / principal) * 100 : 0;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/credits">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Credit Details</h1>
          <p className="text-sm text-muted-foreground">Receipt: {credit.sale?.receiptNumber}</p>
        </div>
        {balance > 0 && (
          <Button onClick={() => setShowPayment(true)} className="gradient-primary">
            <Plus className="h-4 w-4 mr-1" /> Pay
          </Button>
        )}
      </div>

      {/* Status Card */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(balance)}</p>
            </div>
            <span className={`badge ${
              credit.status === 'CLOSED' ? 'badge-success' :
              credit.status === 'OVERDUE' ? 'badge-error' : 'badge-warning'
            }`}>
              {credit.status}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground">{progress.toFixed(0)}% paid</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Customer</span>
            </div>
            <p className="font-medium text-foreground truncate">{credit.customerName || credit.customer?.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{credit.customerPhone || credit.customer?.phone || 'No phone'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Due Date</span>
            </div>
            <p className="font-medium text-foreground">{formatDate(credit.dueDate)}</p>
            <p className="text-xs text-muted-foreground">Created: {formatDate(credit.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Principal Amount</span>
            <span className="text-foreground">{formatCurrency(principal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="text-emerald-400">{formatCurrency(paid)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium pt-2 border-t border-border">
            <span className="text-foreground">Remaining</span>
            <span className="text-primary">{formatCurrency(balance)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {credit.payments && credit.payments.length > 0 ? (
            <div className="space-y-2">
              {credit.payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">{formatCurrency(parseFloat(payment.amount))}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                  </div>
                  <span className="badge badge-info">{payment.paymentMethod}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No payments yet</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Make Payment</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowPayment(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="text-center p-4 bg-secondary rounded-xl">
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    max={balance}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setPaymentData({ ...paymentData, amount: balance.toString() })}>
                    Pay Full Balance
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'CASH', label: 'Cash', icon: Banknote },
                      { value: 'MOBILE_TRANSFER', label: 'Mobile', icon: Smartphone },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPaymentData({ ...paymentData, method: m.value })}
                        className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                          paymentData.method === m.value
                            ? 'bg-primary/20 border-2 border-primary text-primary'
                            : 'bg-secondary border-2 border-transparent'
                        }`}
                      >
                        <m.icon className="h-4 w-4" />
                        <span className="text-sm">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {paymentData.method === 'MOBILE_TRANSFER' && (
                  <>
                    <div className="space-y-2">
                      <Label>Bank Account</Label>
                      <select
                        className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 text-foreground"
                        value={paymentData.bankAccountId}
                        onChange={(e) => setPaymentData({ ...paymentData, bankAccountId: e.target.value })}
                      >
                        <option value="">Select Account</option>
                        {bankAccounts?.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference</Label>
                      <Input
                        value={paymentData.reference}
                        onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                        placeholder="Transaction reference"
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowPayment(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1 gradient-primary" disabled={makePayment.isPending}>
                    {makePayment.isPending ? 'Processing...' : 'Submit Payment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
