'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatCurrencySmart, formatDate } from '@/lib/utils';
import { CreditCard, ChevronRight, Calendar, User, Plus, X, Banknote, Smartphone, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface PaymentModalData {
  creditId: string;
  customerName: string;
  balance: number;
  isFullPay: boolean;
}

export default function CreditsPage() {
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [paymentModal, setPaymentModal] = useState<PaymentModalData | null>(null);
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'CASH', bankAccountId: '', reference: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['credits', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(status && { status }),
      });
      const res = await fetch(`/api/credits?${params}`);
      return res.json();
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
    mutationFn: async ({ creditId, data }: { creditId: string; data: any }) => {
      const res = await fetch(`/api/credits/${creditId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to make payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      setPaymentModal(null);
      setPaymentData({ amount: '', method: 'CASH', bankAccountId: '', reference: '' });
    },
  });

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;
    makePayment.mutate({
      creditId: paymentModal.creditId,
      data: {
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.method,
        bankAccountId: paymentData.bankAccountId || undefined,
        reference: paymentData.reference || undefined,
      },
    });
  };

  const openPaymentModal = (credit: any, isFullPay: boolean) => {
    const balance = parseFloat(credit.balance);
    setPaymentModal({
      creditId: credit.id,
      customerName: credit.customerName || credit.customer?.name || 'Unknown',
      balance,
      isFullPay,
    });
    setPaymentData({
      amount: isFullPay ? balance.toString() : '',
      method: 'CASH',
      bankAccountId: '',
      reference: '',
    });
  };

  const credits = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;
  const totalCredits = data?.data?.total || 0;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'badge-info',
      OVERDUE: 'badge-error',
      CLOSED: 'badge-success',
    };
    return <span className={`badge ${styles[status] || 'badge-info'}`}>{status}</span>;
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Credits</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">{totalCredits} credit records</p>
        </div>
        <Link href="/credits/new" className="hidden sm:block">
          <Button className="gradient-primary glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Credit
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar touch-scroll">
        {['', 'OPEN', 'OVERDUE', 'CLOSED'].map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatus(s); setPage(1); }}
            className="flex-shrink-0 h-11 touch-target-min"
          >
            {s || 'All'}
          </Button>
        ))}
      </div>

      {/* Credits List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mobile-card"><div className="skeleton h-24 rounded-xl" /></div>
          ))}
        </div>
      ) : credits.length === 0 ? (
        <Card className="mobile-card">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No credits found</p>
            <p className="text-muted-foreground text-sm mt-1">Credit sales will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {credits.map((credit: any) => {
            const isOverdue = credit.status === 'OVERDUE';
            const isClosed = credit.status === 'CLOSED';
            const customerName = credit.customerName || credit.customer?.name || 'Unknown';
            const customerPhone = credit.customerPhone || credit.customer?.phone || 'No phone';
            const balance = parseFloat(credit.balance);
            return (
              <Card key={credit.id} className={`mobile-card hover:border-primary/30 transition-all ${isOverdue ? 'border-red-500/30' : ''}`}>
                <CardContent className="p-3 sm:p-4">
                  <Link href={`/credits/${credit.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate">{customerName}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{customerPhone}</p>
                        </div>
                      </div>
                      {getStatusBadge(credit.status)}
                    </div>

                    <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3">
                      <div className="p-1.5 sm:p-2 bg-secondary/50 rounded-lg text-center overflow-hidden">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                        <p className="font-medium text-foreground text-xs sm:text-sm truncate">{formatCurrencySmart(parseFloat(credit.principal))}</p>
                      </div>
                      <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg text-center overflow-hidden">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Paid</p>
                        <p className="font-medium text-emerald-400 text-xs sm:text-sm truncate">{formatCurrencySmart(parseFloat(credit.principal) - balance)}</p>
                      </div>
                      <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-lg text-center overflow-hidden">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Balance</p>
                        <p className="font-bold text-amber-400 text-xs sm:text-sm truncate">{formatCurrencySmart(balance)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm min-w-0 flex-1 flex-wrap">
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className={`${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {isOverdue ? 'Due: ' : ''}{formatDate(credit.dueDate)}
                          </span>
                        </div>
                        {(() => {
                          const dueDate = new Date(credit.dueDate);
                          const today = new Date();
                          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) {
                            return <span className="badge badge-error text-[10px] sm:text-xs">{Math.abs(diffDays)}d late</span>;
                          } else if (diffDays <= 7) {
                            return <span className="badge badge-warning text-[10px] sm:text-xs">{diffDays}d left</span>;
                          }
                          return <span className="badge badge-info text-[10px] sm:text-xs">{diffDays}d</span>;
                        })()}
                      </div>
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                    </div>
                  </Link>

                  {/* Payment Buttons - Only show if not closed */}
                  {!isClosed && balance > 0 && (
                    <div className="flex gap-2 pt-2 sm:pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 sm:h-10 text-[10px] sm:text-xs px-2"
                        onClick={(e) => { e.preventDefault(); openPaymentModal(credit, false); }}
                      >
                        <DollarSign className="h-3 w-3 mr-0.5 sm:mr-1" />
                        Partial
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-9 sm:h-10 text-[10px] sm:text-xs px-2 gradient-primary"
                        onClick={(e) => { e.preventDefault(); openPaymentModal(credit, true); }}
                      >
                        <Banknote className="h-3 w-3 mr-0.5 sm:mr-1" />
                        Full Pay
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-11 touch-target-min">Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-11 touch-target-min">Next</Button>
          </div>
        </div>
      )}

      {/* FAB for mobile */}
      <Link href="/credits/new" className="fab md:hidden bottom-20 safe-area-bottom">
        <Plus className="h-6 w-6" />
      </Link>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">
                {paymentModal.isFullPay ? 'Full Payment' : 'Partial Payment'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setPaymentModal(null)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <form onSubmit={handlePayment} className="space-y-3 sm:space-y-4">
                <div className="text-center p-3 sm:p-4 bg-secondary rounded-xl">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{paymentModal.customerName}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Balance Due</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrencySmart(paymentModal.balance)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    max={paymentModal.balance}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                    className="h-11"
                  />
                  {!paymentModal.isFullPay && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentData({ ...paymentData, amount: paymentModal.balance.toString() })}
                    >
                      Pay Full Balance
                    </Button>
                  )}
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
                        className={`p-3 rounded-xl flex items-center gap-2 transition-all ${paymentData.method === m.value
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
                        className="h-11"
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPaymentModal(null)} className="flex-1 h-11">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-11 gradient-primary" disabled={makePayment.isPending}>
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
