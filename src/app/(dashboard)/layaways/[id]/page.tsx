'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, User, Package, DollarSign, Calendar, Plus, X, Banknote, Smartphone, Check, XCircle, Split } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type PaymentMethodType = 'CASH' | 'MOBILE_TRANSFER' | 'SPLIT';

export default function LayawayDetailPage({ params }: { params: { id: string } }) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [reference, setReference] = useState('');
  // Split payment state
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitMobileAmount, setSplitMobileAmount] = useState('');
  const [splitBankAccountId, setSplitBankAccountId] = useState('');
  const [splitReference, setSplitReference] = useState('');

  const queryClient = useQueryClient();

  const { data: layaway, isLoading } = useQuery({
    queryKey: ['layaway', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/layaways/${params.id}`);
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
      const res = await fetch(`/api/layaways/${params.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to make payment');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layaway', params.id] });
      resetPaymentForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/layaways/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['layaway', params.id] }),
  });

  const resetPaymentForm = () => {
    setShowPayment(false);
    setPaymentMethod('CASH');
    setPaymentAmount('');
    setBankAccountId('');
    setReference('');
    setSplitCashAmount('');
    setSplitMobileAmount('');
    setSplitBankAccountId('');
    setSplitReference('');
  };

  const totalPaymentAmount = parseFloat(paymentAmount) || 0;

  // Auto-calculate remaining split amount
  const handleSplitCashChange = (val: string) => {
    setSplitCashAmount(val);
    const cashVal = parseFloat(val) || 0;
    const remaining = Math.max(0, totalPaymentAmount - cashVal);
    setSplitMobileAmount(remaining > 0 ? remaining.toFixed(2) : '');
  };

  const handleSplitMobileChange = (val: string) => {
    setSplitMobileAmount(val);
    const mobileVal = parseFloat(val) || 0;
    const remaining = Math.max(0, totalPaymentAmount - mobileVal);
    setSplitCashAmount(remaining > 0 ? remaining.toFixed(2) : '');
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = totalPaymentAmount;
    if (amount <= 0) return;

    const payload: any = {
      amount,
    };

    if (paymentMethod === 'SPLIT') {
      const cashAmt = parseFloat(splitCashAmount) || 0;
      const mobileAmt = parseFloat(splitMobileAmount) || 0;

      if (Math.abs(cashAmt + mobileAmt - amount) > 0.01) {
        toast.error('Split amounts must equal the payment amount');
        return;
      }
      if (mobileAmt > 0 && !splitBankAccountId) {
        toast.error('Please select a bank account for the mobile transfer portion');
        return;
      }

      payload.paymentMethod = 'CASH'; // fallback for schema validation
      const payments: any[] = [];
      if (cashAmt > 0) {
        payments.push({ method: 'CASH', amount: cashAmt });
      }
      if (mobileAmt > 0) {
        payments.push({
          method: 'MOBILE_TRANSFER',
          amount: mobileAmt,
          bankAccountId: splitBankAccountId,
          reference: splitReference || undefined,
        });
      }
      payload.payments = payments;
    } else if (paymentMethod === 'MOBILE_TRANSFER') {
      if (!bankAccountId) {
        toast.error('Please select a bank account for mobile transfer');
        return;
      }
      payload.paymentMethod = 'MOBILE_TRANSFER';
      payload.bankAccountId = bankAccountId;
      payload.reference = reference || undefined;
    } else {
      payload.paymentMethod = 'CASH';
    }

    makePayment.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!layaway) {
    return <div className="text-center py-12 text-muted-foreground">Layaway not found</div>;
  }

  const total = Number(layaway.totalAmount);
  const paid = Number(layaway.paidAmount);
  const balance = Number(layaway.balanceAmount);
  const progress = total > 0 ? (paid / total) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'badge-warning';
      case 'COMPLETED': return 'badge-success';
      case 'CANCELLED': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Cash';
      case 'MOBILE_TRANSFER': return 'Mobile';
      case 'CARD': return 'Card';
      default: return method;
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/layaways">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{layaway.layawayNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(layaway.createdAt)}</p>
        </div>
        <span className={`badge ${getStatusBadge(layaway.status)}`}>{layaway.status}</span>
      </div>

      {/* Progress Card */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Balance Due</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(balance)}</p>
            </div>
            {layaway.status === 'ACTIVE' && balance > 0 && (
              <Button onClick={() => setShowPayment(true)} className="gradient-primary">
                <Plus className="h-4 w-4 mr-1" /> Pay
              </Button>
            )}
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

      {/* Customer & Due Date */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Customer</span>
            </div>
            <p className="font-medium text-foreground truncate">{layaway.customer?.name}</p>
            <p className="text-xs text-muted-foreground">{layaway.customer?.phone || 'No phone'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Due Date</span>
            </div>
            <p className="font-medium text-foreground">{layaway.dueDate ? formatDate(layaway.dueDate) : 'No due date'}</p>
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
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-foreground">{formatCurrency(total)}</span>
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

      {/* Items */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Items ({layaway.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {layaway.items && layaway.items.length > 0 ? (
            <div className="space-y-2">
              {layaway.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">{item.item?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(item.unitPrice))} × {Number(item.qty)}
                    </p>
                  </div>
                  <p className="font-bold text-primary">{formatCurrency(Number(item.lineTotal))}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No items</p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {layaway.payments && layaway.payments.length > 0 ? (
            <div className="space-y-2">
              {layaway.payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">{formatCurrency(Number(payment.amount))}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                    {payment.notes && <p className="text-xs text-muted-foreground mt-0.5">{payment.notes}</p>}
                  </div>
                  <span className={`badge ${payment.paymentMethod === 'CASH' ? 'badge-success' : 'badge-info'}`}>
                    {getMethodLabel(payment.paymentMethod)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No payments yet</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {layaway.status === 'ACTIVE' && (
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              {balance <= 0 && (
                <Button onClick={() => updateStatus.mutate('COMPLETED')} className="flex-1 gradient-primary">
                  <Check className="h-4 w-4 mr-2" /> Complete & Release Items
                </Button>
              )}
              <Button variant="outline" onClick={() => updateStatus.mutate('CANCELLED')} className="text-destructive">
                <XCircle className="h-4 w-4 mr-2" /> Cancel Layaway
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Make Payment</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetPaymentForm}>
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
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(e.target.value);
                      // Reset split amounts when total changes
                      setSplitCashAmount('');
                      setSplitMobileAmount('');
                    }}
                    placeholder="Enter amount"
                    required
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setPaymentAmount(balance.toString());
                    setSplitCashAmount('');
                    setSplitMobileAmount('');
                  }}>
                    Pay Full Balance
                  </Button>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'CASH' as PaymentMethodType, label: 'Cash', icon: Banknote },
                      { value: 'MOBILE_TRANSFER' as PaymentMethodType, label: 'Mobile', icon: Smartphone },
                      { value: 'SPLIT' as PaymentMethodType, label: 'Split', icon: Split },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPaymentMethod(m.value)}
                        className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                          paymentMethod === m.value
                            ? 'bg-primary/20 border-2 border-primary text-primary'
                            : 'bg-secondary border-2 border-transparent text-muted-foreground'
                        }`}
                      >
                        <m.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Transfer Fields */}
                {paymentMethod === 'MOBILE_TRANSFER' && (
                  <div className="space-y-3 p-3 bg-secondary/50 rounded-xl border border-border">
                    <div className="space-y-2">
                      <Label>Bank Account *</Label>
                      <select
                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                        value={bankAccountId}
                        onChange={(e) => setBankAccountId(e.target.value)}
                        required
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
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Transaction reference"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                )}

                {/* Split Payment Fields */}
                {paymentMethod === 'SPLIT' && totalPaymentAmount > 0 && (
                  <div className="space-y-3 p-3 bg-secondary/50 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground font-medium">Split between Cash & Mobile Transfer</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                          Cash
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={splitCashAmount}
                          onChange={(e) => handleSplitCashChange(e.target.value)}
                          placeholder="0.00"
                          className="bg-background border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5 text-blue-400" />
                          Mobile
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={splitMobileAmount}
                          onChange={(e) => handleSplitMobileChange(e.target.value)}
                          placeholder="0.00"
                          className="bg-background border-border"
                        />
                      </div>
                    </div>
                    {/* Sum validation indicator */}
                    {(parseFloat(splitCashAmount) || 0) + (parseFloat(splitMobileAmount) || 0) > 0 && (
                      <div className={`text-xs px-2 py-1 rounded-lg ${
                        Math.abs(((parseFloat(splitCashAmount) || 0) + (parseFloat(splitMobileAmount) || 0)) - totalPaymentAmount) < 0.01
                          ? 'text-emerald-400 bg-emerald-400/10'
                          : 'text-orange-400 bg-orange-400/10'
                      }`}>
                        Sum: {formatCurrency((parseFloat(splitCashAmount) || 0) + (parseFloat(splitMobileAmount) || 0))} / {formatCurrency(totalPaymentAmount)}
                        {Math.abs(((parseFloat(splitCashAmount) || 0) + (parseFloat(splitMobileAmount) || 0)) - totalPaymentAmount) < 0.01 ? ' ✓' : ' — must equal payment'}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Bank Account (mobile portion) *</Label>
                      <select
                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                        value={splitBankAccountId}
                        onChange={(e) => setSplitBankAccountId(e.target.value)}
                      >
                        <option value="">Select Account</option>
                        {bankAccounts?.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference (mobile portion)</Label>
                      <Input
                        value={splitReference}
                        onChange={(e) => setSplitReference(e.target.value)}
                        placeholder="Transaction reference"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={resetPaymentForm} className="flex-1">Cancel</Button>
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
