'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { 
  ArrowRightLeft, 
  Building2, 
  Wallet, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

type TransferType = 'CASH_TO_BANK' | 'BANK_TO_CASH' | 'BANK_TO_BANK';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  currentBalance: number;
}

interface FundTransfer {
  id: string;
  type: TransferType;
  amount: number;
  sourceBank?: { id: string; bankName: string; accountNumber: string };
  destBank?: { id: string; bankName: string; accountNumber: string };
  reference?: string;
  notes?: string;
  user: { id: string; fullName: string };
  createdAt: string;
}

interface CurrentSession {
  id: string;
  closingCashBalance: number;
  status: string;
}

export default function MoneyManagementPage() {
  useSession();
  const [transferType, setTransferType] = useState<TransferType>('CASH_TO_BANK');
  const [amount, setAmount] = useState('');
  const [sourceBankId, setSourceBankId] = useState('');
  const [destBankId, setDestBankId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<FundTransfer[]>([]);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sessionCashBalance, setSessionCashBalance] = useState<number>(0);
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [accountsRes, transfersRes, sessionRes, dashboardRes] = await Promise.all([
        fetch('/api/bank-accounts'),
        fetch('/api/fund-transfers'),
        fetch('/api/sessions/current'),
        fetch('/api/dashboard'), // Fetch session financials for accurate cash balance
      ]);

      let bankAccountsSet = false;
      let sessionActive = false;

      // Use dashboard API for accurate session-aware cash balance and bank accounts
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        if (dashboardData.success && dashboardData.data?.sessionFinancials) {
          const financials = dashboardData.data.sessionFinancials;
          sessionActive = !!financials.hasActiveSession;
          setHasActiveSession(financials.hasActiveSession);
          setSessionCashBalance(financials.cashInHand || 0);
          
          // When session is active, use bank accounts from dashboard (has session transaction info)
          if (financials.hasActiveSession && financials.bankAccounts && financials.bankAccounts.length > 0) {
            setBankAccounts(financials.bankAccounts.map((a: { currentBalance: unknown; [key: string]: unknown }) => ({
              ...a,
              currentBalance: Number(a.currentBalance),
            })));
            bankAccountsSet = true;
          } else if (!financials.hasActiveSession) {
            // No active session - show bank accounts with zero balance
            if (accountsRes.ok) {
              const accountsData = await accountsRes.json();
              if (accountsData.success) {
                setBankAccounts(accountsData.data.map((a: { currentBalance: unknown; [key: string]: unknown }) => ({
                  ...a,
                  currentBalance: 0, // Show zero when no session
                })));
                bankAccountsSet = true;
              }
            }
          }
        } else {
          setHasActiveSession(false);
          setSessionCashBalance(0);
        }
      }

      // Fallback to direct bank accounts API if dashboard didn't provide them.
      // Read the session flag from the just-fetched response, not from React state,
      // which has not updated yet within this same run.
      if (!bankAccountsSet && accountsRes.ok) {
        const accountsData = await accountsRes.json();
        if (accountsData.success) {
          setBankAccounts(accountsData.data.map((a: { currentBalance: unknown; [key: string]: unknown }) => ({
            ...a,
            currentBalance: sessionActive ? Number(a.currentBalance) : 0,
          })));
        }
      }

      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        if (transfersData.success) {
          setRecentTransfers(transfersData.data);
        }
      }

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.success && sessionData.data) {
          setCurrentSession({
            ...sessionData.data,
            closingCashBalance: Number(sessionData.data.closingCashBalance),
          });
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!currentSession) {
      setError('No active session. Please open a session first.');
      setLoading(false);
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      let endpoint = '';
      let body: Record<string, unknown> = {
        amount: amountNum,
        reference,
        notes,
        sessionId: currentSession.id,
      };

      switch (transferType) {
        case 'CASH_TO_BANK':
          endpoint = '/api/fund-transfers/cash-to-bank';
          body.destBankId = destBankId;
          break;
        case 'BANK_TO_CASH':
          endpoint = '/api/fund-transfers/bank-to-cash';
          body.sourceBankId = sourceBankId;
          break;
        case 'BANK_TO_BANK':
          endpoint = '/api/fund-transfers/bank-to-bank';
          body.sourceBankId = sourceBankId;
          body.destBankId = destBankId;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Transfer completed successfully!');
        setAmount('');
        setReference('');
        setNotes('');
        fetchData();
      } else {
        setError(result.error?.message || 'Transfer failed');
      }
    } catch (err) {
      setError('Failed to process transfer');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function getTransferTypeLabel(type: TransferType) {
    switch (type) {
      case 'CASH_TO_BANK': return 'Cash → Bank';
      case 'BANK_TO_CASH': return 'Bank → Cash';
      case 'BANK_TO_BANK': return 'Bank → Bank';
    }
  }

  const transferTypes = [
    { type: 'CASH_TO_BANK' as TransferType, label: 'Cash → Bank', icon: Wallet, color: 'emerald' },
    { type: 'BANK_TO_CASH' as TransferType, label: 'Bank → Cash', icon: Building2, color: 'blue' },
    { type: 'BANK_TO_BANK' as TransferType, label: 'Bank → Bank', icon: ArrowRightLeft, color: 'purple' },
  ];

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Money Management</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Transfer funds between cash and bank accounts (Current Session)</p>
      </div>

      {/* Current Balances */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="mobile-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <p className={`text-xl font-bold ${hasActiveSession ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              {hasActiveSession ? formatCurrency(sessionCashBalance) : '$0.00'}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasActiveSession ? 'Cash In Hand' : 'No Active Session'}
            </p>
          </CardContent>
        </Card>

        {bankAccounts.slice(0, 3).map((account) => (
          <Card key={account.id} className="mobile-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(account.currentBalance)}</p>
              <p className="text-xs text-muted-foreground truncate">{account.bankName}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Transfer Form */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              New Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transfer Type Selection */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Transfer Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {transferTypes.map((t) => {
                    const Icon = t.icon;
                    const isSelected = transferType === t.type;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setTransferType(t.type)}
                        className={`p-3 rounded-xl text-center transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-secondary border-2 border-transparent hover:border-border'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mx-auto mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-xs ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Source Bank */}
              {(transferType === 'BANK_TO_CASH' || transferType === 'BANK_TO_BANK') && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Source Bank Account</Label>
                  <select
                    value={sourceBankId}
                    onChange={(e) => setSourceBankId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                    required
                  >
                    <option value="">Select source account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {formatCurrency(account.currentBalance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Destination Bank */}
              {(transferType === 'CASH_TO_BANK' || transferType === 'BANK_TO_BANK') && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Destination Bank Account</Label>
                  <select
                    value={destBankId}
                    onChange={(e) => setDestBankId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                    required
                  >
                    <option value="">Select destination account</option>
                    {bankAccounts
                      .filter((a) => a.id !== sourceBankId)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bankName} - {formatCurrency(account.currentBalance)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Reference (Optional)</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Transaction reference"
                  className="bg-secondary border-border"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Notes (Optional)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-20 rounded-xl border border-border bg-secondary px-4 py-3 text-sm resize-none"
                  placeholder="Additional notes"
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full gradient-primary glow-sm touch-btn" 
                size="lg"
                disabled={loading || !currentSession}
              >
                {loading ? 'Processing...' : 'Complete Transfer'}
              </Button>

              {!currentSession && (
                <p className="text-sm text-center text-amber-500">
                  Please open a session to make transfers
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Recent Transfers - Current Session Only */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Session Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransfers.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {recentTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        transfer.type === 'CASH_TO_BANK' ? 'bg-emerald-500/20' :
                        transfer.type === 'BANK_TO_CASH' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                      }`}>
                        {transfer.type === 'CASH_TO_BANK' ? (
                          <Wallet className="h-5 w-5 text-emerald-500" />
                        ) : transfer.type === 'BANK_TO_CASH' ? (
                          <Building2 className="h-5 w-5 text-blue-500" />
                        ) : (
                          <ArrowRightLeft className="h-5 w-5 text-purple-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{getTransferTypeLabel(transfer.type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {transfer.type === 'CASH_TO_BANK' && transfer.destBank && (
                            <>To: {transfer.destBank.bankName}</>
                          )}
                          {transfer.type === 'BANK_TO_CASH' && transfer.sourceBank && (
                            <>From: {transfer.sourceBank.bankName}</>
                          )}
                          {transfer.type === 'BANK_TO_BANK' && transfer.sourceBank && transfer.destBank && (
                            <>{transfer.sourceBank.bankName} → {transfer.destBank.bankName}</>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(transfer.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(transfer.amount)}</p>
                      {transfer.reference && (
                        <p className="text-xs text-muted-foreground">{transfer.reference}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent transfers</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
