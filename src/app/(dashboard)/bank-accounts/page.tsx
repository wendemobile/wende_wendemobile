'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Plus, Building, TrendingUp, TrendingDown, AlertTriangle, Landmark, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function BankAccountsPage() {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  // Fetch dashboard to check session status
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-session'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      return res.json();
    },
  });

  const { data: bankTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['bank-transactions', selectedBankId],
    queryFn: async () => {
      if (!selectedBankId) return null;
      const res = await fetch(`/api/bank-accounts/${selectedBankId}/session-transactions`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    enabled: !!selectedBankId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/bank-accounts');
      return res.json();
    },
  });

  const hasActiveSession = dashboardData?.data?.sessionFinancials?.hasActiveSession || false;
  const sessionBankAccounts = dashboardData?.data?.sessionFinancials?.bankAccounts || [];
  const rawAccounts = data?.data || [];
  
  // Use session bank accounts when session is active (has session-specific balances)
  // Fall back to raw accounts with zero balances when no session
  const accounts = hasActiveSession && sessionBankAccounts.length > 0
    ? sessionBankAccounts.map((sessionAcc: any) => {
        // Merge session data with raw account data (for fields like holderName, initialBalance)
        const rawAcc = rawAccounts.find((r: any) => r.id === sessionAcc.id) || {};
        return {
          ...rawAcc,
          ...sessionAcc,
          currentBalance: sessionAcc.currentBalance, // Session-specific balance
        };
      })
    : rawAccounts.map((acc: any) => ({
        ...acc,
        currentBalance: 0, // Show zero when no session
      }));
  
  // Calculate total from session balances
  const totalBalance = hasActiveSession 
    ? accounts.reduce((sum: number, acc: any) => sum + parseFloat(acc.currentBalance || 0), 0)
    : 0;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bank Accounts</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage bank accounts and mobile money</p>
        </div>
        <Link href="/bank-accounts/new">
          <Button className="gradient-primary glow-sm w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </Link>
      </div>

      {/* No Session Warning */}
      {!hasActiveSession && (
        <Card className="mobile-card bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">No Active Session</p>
              <p className="text-xs text-muted-foreground">Bank balances are hidden. Open a session to view balances.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Balance Card */}
      <Card className="mobile-card gradient-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className={`text-3xl font-bold mt-1 ${hasActiveSession ? 'text-primary' : 'text-muted-foreground'}`}>
                {hasActiveSession ? formatCurrency(totalBalance) : '$0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasActiveSession ? `${accounts.length} accounts` : 'Session closed'}
              </p>
            </div>
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center glow-sm">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton h-40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="mobile-card">
          <CardContent className="py-12 text-center">
            <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No bank accounts</p>
            <p className="text-muted-foreground text-sm mt-1">Add your first bank account</p>
            <Link href="/bank-accounts/new">
              <Button className="mt-4 gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account: any) => {
            const balance = hasActiveSession ? parseFloat(account.currentBalance || 0) : 0;
            // Use session inflow/outflow for change indicator (session-specific)
            const sessionInflow = parseFloat(account.sessionInflow || 0);
            const sessionOutflow = parseFloat(account.sessionOutflow || 0);
            const change = hasActiveSession ? sessionInflow - sessionOutflow : 0;
            const isPositive = change >= 0;

            return (
              <div
                key={account.id}
                onClick={() => setSelectedBankId(account.id)}
                className="cursor-pointer text-left"
              >
                <Card className="mobile-card hover:border-primary/30 active:scale-[0.99] transition-all h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Building className="h-6 w-6 text-blue-500" />
                      </div>
                      <span className={`badge ${account.isActive ? 'badge-success' : 'badge-error'}`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-foreground">{account.holderName}</h3>
                    <p className="text-sm text-muted-foreground">{account.bankName}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{account.accountNumber}</p>
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Current Balance</p>
                          <p className={`text-xl font-bold ${hasActiveSession ? 'text-primary' : 'text-muted-foreground'}`}>
                            {hasActiveSession ? formatCurrency(balance) : '$0.00'}
                          </p>
                        </div>
                        {hasActiveSession && (
                          <div className="flex items-center gap-1">
                            {isPositive ? (
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                              {isPositive ? '+' : ''}{formatCurrency(change)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Bank Transaction Modal */}
      <Dialog open={!!selectedBankId} onOpenChange={(open) => !open && setSelectedBankId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 pr-8">
              <Landmark className="h-4 w-4 text-primary" />
              {bankTransactions?.data?.bankName || 'Bank'} - Session Transactions
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 overflow-y-auto min-h-0">
            {loadingTransactions ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : !bankTransactions?.data?.hasActiveSession ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active session</p>
              </div>
            ) : bankTransactions?.data?.transactions?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transactions this session</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-secondary rounded-xl">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Inflow</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(bankTransactions?.data?.summary?.totalInflow || 0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Outflow</p>
                    <p className="font-bold text-red-600 dark:text-red-500">{formatCurrency(bankTransactions?.data?.summary?.totalOutflow || 0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Count</p>
                    <p className="font-bold">{bankTransactions?.data?.summary?.transactionCount || 0}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {bankTransactions?.data?.transactions?.map((tx: any) => (
                    <div key={tx.id} className="p-3 bg-secondary rounded-xl flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-medium text-sm truncate">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">{tx.reference || new Date(tx.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <p className={`font-bold shrink-0 ${tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* FAB for mobile */}
      <Link href="/bank-accounts/new" className="fab md:hidden bottom-20 safe-area-bottom">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
