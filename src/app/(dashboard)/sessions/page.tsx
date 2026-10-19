'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  Clock, DollarSign, Play, Square, Wallet, TrendingUp, AlertTriangle,
  Plus, Receipt, ShoppingCart, Layers, Gift, X, ArrowDownCircle, ArrowUpCircle,
  History, ChevronRight, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const INCOME_CATEGORIES = [
  { value: 'GIFT', label: 'Gift/Donation' },
  { value: 'REFUND', label: 'Refund Received' },
  { value: 'ADJUSTMENT', label: 'Cash Adjustment' },
  { value: 'OTHER', label: 'Other Income' },
];

export default function SessionsPage() {
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingCount, setClosingCount] = useState('');
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [incomeData, setIncomeData] = useState({ amount: '', category: 'OTHER', description: '' });
  const queryClient = useQueryClient();

  const { data: currentSession, isLoading } = useQuery({
    queryKey: ['current-session'],
    queryFn: async () => {
      const res = await fetch('/api/sessions/current');
      const data = await res.json();
      return data.data;
    },
  });

  const { data: sessionStats } = useQuery({
    queryKey: ['session-stats', currentSession?.id],
    queryFn: async () => {
      if (!currentSession?.id) return null;
      const res = await fetch(`/api/sessions/${currentSession.id}/stats`);
      const data = await res.json();
      return data.data;
    },
    enabled: !!currentSession?.id,
  });

  const { data: specialIncomes = [] } = useQuery({
    queryKey: ['special-incomes', currentSession?.id],
    queryFn: async () => {
      if (!currentSession?.id) return [];
      const res = await fetch(`/api/special-income?sessionId=${currentSession.id}`);
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!currentSession?.id,
  });

  const { data: sessionHistory } = useQuery({
    queryKey: ['session-history'],
    queryFn: async () => {
      const res = await fetch('/api/sessions?pageSize=10');
      const data = await res.json();
      return data.data;
    },
    enabled: showHistory,
  });

  const openSession = useMutation({
    mutationFn: async (balance: number) => {
      const res = await fetch('/api/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingCashBalance: balance }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to open session');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-session'] });
      setOpeningBalance('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const closeSession = useMutation({
    mutationFn: async (actualCount: number) => {
      const res = await fetch('/api/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualCashCount: actualCount }),
      });
      if (!res.ok) throw new Error('Failed to close session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-session'] });
      setClosingCount('');
    },
  });

  const addSpecialIncome = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/special-income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add income');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-incomes'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      setShowAddIncome(false);
      setIncomeData({ amount: '', category: 'OTHER', description: '' });
    },
  });

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    addSpecialIncome.mutate({
      amount: parseFloat(incomeData.amount),
      category: incomeData.category,
      description: incomeData.description || undefined,
    });
  };

  // Calculate totals
  const totalSpecialIncome = specialIncomes.reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);
  const salesTotal = sessionStats?.salesTotal || 0;
  const expensesTotal = sessionStats?.expensesTotal || 0;
  const layawayPayments = sessionStats?.layawayPayments || 0;
  const creditPayments = sessionStats?.creditPayments || 0;
  const openingCash = currentSession ? parseFloat(currentSession.openingCashBalance) : 0;
  const expectedCash = openingCash + salesTotal + totalSpecialIncome + layawayPayments + creditPayments - expensesTotal;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Daily Session</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Cash drawer & daily reconciliation</p>
      </div>

      {!currentSession ? (
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              Open New Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-secondary rounded-xl text-center">
              <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No Active Session</p>
              <p className="text-sm text-muted-foreground mt-1">Start a new session to begin operations</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="openingBalance">Opening Cash Balance</Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                placeholder="Enter opening cash balance"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="bg-secondary border-border h-11"
              />
            </div>
            <Button
              onClick={() => openSession.mutate(parseFloat(openingBalance) || 0)}
              disabled={openSession.isPending}
              className="w-full gradient-primary glow-sm touch-btn"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              {openSession.isPending ? 'Opening...' : 'Open Session'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Session Status */}
          <Card className="mobile-card gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="badge badge-success">Session Active</span>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Started</p>
              <p className="text-sm font-medium text-foreground">{formatDateTime(currentSession.openedAt)}</p>
            </CardContent>
          </Card>

          {/* Daily Reconciliation Summary */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Daily Reconciliation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Opening Cash */}
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-foreground">Opening Cash</span>
                </div>
                <span className="font-medium text-foreground">{formatCurrency(openingCash)}</span>
              </div>

              {/* Sales */}
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-foreground">Sales (Cash)</span>
                </div>
                <span className="font-medium text-emerald-400">+{formatCurrency(salesTotal)}</span>
              </div>

              {/* Layaway Payments */}
              <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-foreground">Layaway Payments</span>
                </div>
                <span className="font-medium text-purple-400">+{formatCurrency(layawayPayments)}</span>
              </div>

              {/* Credit Payments */}
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-foreground">Credit Payments</span>
                </div>
                <span className="font-medium text-blue-400">+{formatCurrency(creditPayments)}</span>
              </div>

              {/* Special Income */}
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-foreground">Special Income</span>
                </div>
                <span className="font-medium text-amber-400">+{formatCurrency(totalSpecialIncome)}</span>
              </div>

              {/* Expenses */}
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-foreground">Expenses</span>
                </div>
                <span className="font-medium text-red-400">-{formatCurrency(expensesTotal)}</span>
              </div>

              {/* Expected Cash */}
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl border border-primary/20 mt-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Expected Cash</span>
                </div>
                <span className="font-bold text-primary text-lg">{formatCurrency(expectedCash)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="mobile-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Transactions</span>
                </div>
                <p className="text-xl font-bold text-foreground">{sessionStats?.salesCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Special Incomes</span>
                </div>
                <p className="text-xl font-bold text-foreground">{specialIncomes.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Special Income */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-500" />
                  Special Income
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddIncome(true)} className="gradient-primary">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {specialIncomes.length > 0 ? (
                <div className="space-y-2">
                  {specialIncomes.map((income: any) => (
                    <div key={income.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                      <div>
                        <p className="font-medium text-foreground">{formatCurrency(parseFloat(income.amount))}</p>
                        <p className="text-xs text-muted-foreground">{income.category} {income.description && `- ${income.description}`}</p>
                      </div>
                      <span className="badge badge-success">+</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">No special income recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Close Session */}
          <Card className="mobile-card border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-500">
                <Square className="h-4 w-4" />
                Close Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Count your cash drawer</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected: <span className="font-bold text-primary">{formatCurrency(expectedCash)}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="closingCount">Actual Cash Count</Label>
                <Input
                  id="closingCount"
                  type="number"
                  step="0.01"
                  placeholder="Enter actual cash count"
                  value={closingCount}
                  onChange={(e) => setClosingCount(e.target.value)}
                  className="bg-secondary border-border h-11"
                />
                {closingCount && (
                  <p className={`text-sm ${parseFloat(closingCount) === expectedCash ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Variance: {formatCurrency(parseFloat(closingCount) - expectedCash)}
                  </p>
                )}
              </div>
              <Button
                onClick={() => closeSession.mutate(parseFloat(closingCount) || 0)}
                disabled={closeSession.isPending}
                variant="destructive"
                className="w-full touch-btn"
                size="lg"
              >
                <Square className="h-4 w-4 mr-2" />
                {closeSession.isPending ? 'Closing...' : 'Close Session'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session History Button */}
      <Card className="mobile-card">
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full justify-between touch-btn"
            onClick={() => setShowHistory(true)}
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <span>View Session History</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Add Special Income Modal */}
      {showAddIncome && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Add Special Income</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddIncome(false)} className="h-11 w-11 touch-target-min">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={incomeData.amount}
                    onChange={(e) => setIncomeData({ ...incomeData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                    value={incomeData.category}
                    onChange={(e) => setIncomeData({ ...incomeData, category: e.target.value })}
                  >
                    {INCOME_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={incomeData.description}
                    onChange={(e) => setIncomeData({ ...incomeData, description: e.target.value })}
                    placeholder="Optional description"
                    className="h-11"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddIncome(false)} className="flex-1 h-11 touch-target-min">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-11 touch-target-min gradient-primary" disabled={addSpecialIncome.isPending}>
                    {addSpecialIncome.isPending ? 'Adding...' : 'Add Income'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-card border-border max-h-[80dvh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Session History
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="h-11 w-11 touch-target-min">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              {sessionHistory?.sessions && sessionHistory.sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessionHistory.sessions.map((s: any) => (
                    <div
                      key={s.id}
                      className={`p-4 rounded-xl border ${
                        s.status === 'OPEN' 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-secondary/50 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {s.status === 'OPEN' ? (
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={`text-sm font-medium ${s.status === 'OPEN' ? 'text-emerald-400' : 'text-foreground'}`}>
                            {new Date(s.businessDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <span className={`badge ${s.status === 'OPEN' ? 'badge-success' : 'badge-info'}`}>
                          {s.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Opening</p>
                          <p className="font-medium text-foreground">{formatCurrency(parseFloat(s.openingCashBalance))}</p>
                        </div>
                        {s.status !== 'OPEN' && (
                          <div>
                            <p className="text-xs text-muted-foreground">Closing</p>
                            <p className="font-medium text-foreground">{formatCurrency(parseFloat(s.closingCashBalance || 0))}</p>
                          </div>
                        )}
                      </div>

                      {s.status !== 'OPEN' && s.cashVariance !== null && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Variance</span>
                            <span className={`text-sm font-medium ${
                              parseFloat(s.cashVariance) === 0 
                                ? 'text-emerald-400' 
                                : parseFloat(s.cashVariance) > 0 
                                  ? 'text-blue-400' 
                                  : 'text-red-400'
                            }`}>
                              {formatCurrency(parseFloat(s.cashVariance))}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>Opened by: {s.openedBy?.fullName || 'Unknown'}</p>
                        {s.closedBy && <p>Closed by: {s.closedBy?.fullName}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No session history found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
