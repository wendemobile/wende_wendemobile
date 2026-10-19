'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { formatCurrency, generateUUID } from '@/lib/utils';
import { X, Plus, Trash2, Banknote, CreditCard, Smartphone, Users, Calendar, User, Phone } from 'lucide-react';

interface PaymentEntry {
  id: string;
  method: 'CASH' | 'MOBILE_TRANSFER' | 'CREDIT';
  amount: number;
  bankAccountId?: string;
  reference?: string;
  dueDate?: string;
  customerName?: string;
  customerPhone?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onComplete: (payments: PaymentEntry[]) => void;
}

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'MOBILE_TRANSFER', label: 'Mobile', icon: Smartphone },
  { value: 'CREDIT', label: 'Credit', icon: Users },
];

export function PaymentModal({ isOpen, onClose, total, onComplete }: PaymentModalProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { id: generateUUID(), method: 'CASH', amount: total },
  ]);

  // Reset payments when modal opens or total changes
  useEffect(() => {
    if (isOpen) {
      setPayments([{ id: generateUUID(), method: 'CASH', amount: total }]);
    }
  }, [isOpen, total]);

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      return data.data || [];
    },
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;
  const change = totalPaid > total ? totalPaid - total : 0;

  // Credit validation
  const creditPayment = payments.find(p => p.method === 'CREDIT');
  const hasCreditPayment = !!creditPayment;
  const creditMissingInfo = hasCreditPayment && (!creditPayment.customerName || !creditPayment.customerPhone || !creditPayment.dueDate);


  const addPayment = () => {
    setPayments([
      ...payments,
      { id: generateUUID(), method: 'CASH', amount: Math.max(0, remaining) },
    ]);
  };

  const removePayment = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter((p) => p.id !== id));
    }
  };

  const updatePayment = (id: string, updates: Partial<PaymentEntry>) => {
    setPayments(payments.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const selectMethod = (id: string, method: PaymentEntry['method']) => {
    updatePayment(id, { method });
  };

  const handleComplete = () => {
    if (creditMissingInfo) {
      toast.error('Customer name, phone, and due date are required for credit sales');
      return;
    }
    if (totalPaid >= total) {
      onComplete(payments);
    } else {
      toast.error(`Remaining ${formatCurrency(remaining)} must be paid to complete the sale`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
      <Card className="w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[90dvh] flex flex-col mobile-card rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Header - sticky */}
        <CardHeader className="flex flex-row items-center justify-between bg-card z-10 p-3 sm:p-4 border-b border-border shrink-0">
          <CardTitle className="text-lg">Payment</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="touch-target-min">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        {/* Scrollable content */}
        <CardContent className="flex-1 min-h-0 p-0 overflow-y-auto overscroll-contain touch-scroll">
          <div className="p-3 sm:p-4 pb-6">
            <div className="space-y-4">
              {/* Total Display */}
              <div className="text-center p-4 sm:p-6 bg-secondary rounded-xl sm:rounded-2xl">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl sm:text-4xl font-bold text-primary">{formatCurrency(total)}</p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Payment Methods</Label>
                  <Button variant="outline" size="sm" onClick={addPayment} className="touch-target-min h-11">
                    <Plus className="h-4 w-4 mr-1" /> Split
                  </Button>
                </div>

                {payments.map((payment) => (
                  <div key={payment.id} className="p-3 sm:p-4 bg-secondary rounded-xl space-y-3">
                    {/* Method Selection */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {paymentMethods.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => selectMethod(payment.id, m.value as PaymentEntry['method'])}
                          className={`p-2 sm:p-3 rounded-xl flex flex-col items-center gap-1 transition-all touch-target-min min-h-[56px] ${payment.method === m.value
                            ? 'bg-primary/20 border-2 border-primary text-primary'
                            : 'bg-background border-2 border-transparent hover:border-border'
                            }`}
                        >
                          <m.icon className="h-5 w-5" />
                          <span className="text-[10px] sm:text-xs font-medium">{m.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Amount Input */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={payment.amount === 0 ? '' : payment.amount}
                          placeholder="0"
                          onChange={(e) => {
                            const v = e.target.value;
                            updatePayment(payment.id, { amount: v === '' ? 0 : parseFloat(v) || 0 });
                          }}
                          className="text-lg font-bold bg-background border-border h-11"
                        />
                      </div>
                      {payments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePayment(payment.id)}
                          className="touch-target-min text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>

                    {/* Bank Account for Mobile Transfer */}
                    {payment.method === 'MOBILE_TRANSFER' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Select
                          value={payment.bankAccountId || ''}
                          onValueChange={(v) => updatePayment(payment.id, { bankAccountId: v })}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(bankAccounts) && bankAccounts.map((acc: any) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.bankName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Reference"
                          value={payment.reference || ''}
                          onChange={(e) => updatePayment(payment.id, { reference: e.target.value })}
                          className="bg-background border-border h-11"
                        />
                      </div>
                    )}

                    {/* Credit Sale - Customer Info - stacked on mobile */}
                    {payment.method === 'CREDIT' && (
                      <div className="space-y-3 p-3 bg-background rounded-lg border border-primary/30">
                        <p className="text-xs font-medium text-primary">Credit Customer Info</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" /> Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              placeholder="Customer name"
                              value={payment.customerName || ''}
                              onChange={(e) => updatePayment(payment.id, { customerName: e.target.value })}
                              className={`bg-secondary border-border h-11 ${!payment.customerName ? 'border-destructive' : ''}`}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" /> Phone <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              placeholder="Phone number"
                              value={payment.customerPhone || ''}
                              onChange={(e) => updatePayment(payment.id, { customerPhone: e.target.value })}
                              className={`bg-secondary border-border h-11 ${!payment.customerPhone ? 'border-destructive' : ''}`}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Due Date <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={payment.dueDate || ''}
                            onChange={(e) => updatePayment(payment.id, { dueDate: e.target.value })}
                            className={`bg-secondary border-border h-11 ${!payment.dueDate ? 'border-destructive' : ''}`}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-medium">{formatCurrency(totalPaid)}</span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-bold text-destructive">{formatCurrency(remaining)}</span>
                  </div>
                )}
                {change > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Change</span>
                    <span className="font-bold text-emerald-500">{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer with Complete Button - always visible */}
        <div className="p-3 sm:p-4 border-t border-border bg-card shrink-0 safe-area-bottom">
          <Button
            className="w-full gradient-primary glow-sm touch-target-min h-12 text-base"
            size="lg"
            onClick={handleComplete}
            disabled={totalPaid < total || creditMissingInfo}
          >
            Complete Sale
          </Button>
        </div>
      </Card>
    </div>
  );
}
