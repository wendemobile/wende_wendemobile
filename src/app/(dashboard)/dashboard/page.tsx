'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatCurrencySmart } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useCart } from '@/contexts/cart-context';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  Building2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Wallet,
  ChevronRight,
  ScanLine,
  Plus,
  Banknote,
  CreditCard,
  Receipt,
  X,
  Landmark
} from 'lucide-react';

interface SessionFinancials {
  hasActiveSession: boolean;
  sessionId: string | null;
  sessionStartTime: string | null;
  cashInHand: number;
  cashInHandBreakdown: {
    openingBalance: number;
    cashSales: number;
    cashLayawayPayments: number;
    cashCreditPayments: number;
    specialIncome: number;
    cashExpenses: number;
    cashToBank: number;
    bankToCash: number;
    total: number;
  };
  totalExpenses: number;
  totalMobileTransfers: number;
  mobileTransferBreakdown?: {
    salesPayments: number;
    layawayPayments: number;
    creditPayments: number;
    total: number;
    transactionCount: number;
  };
  bankAccounts: Array<{
    id: string;
    bankName: string;
    accountNumber: string;
    currentBalance: number;
    sessionTransactionCount: number;
    sessionInflow: number;
    sessionOutflow: number;
  }>;
}

interface DashboardData {
  sessionFinancials: SessionFinancials;
  totalSales: { today: number; week: number; month: number };
  profitMetrics: { grossProfit: number; netProfit: number; margin: number };
  locationsOverview: Array<{ id: string; name: string; type: string; itemCount: number; stockValue: number }>;
  topSellingItems: Array<{ itemId: string; itemName: string; totalSold: number; revenue: number }>;
  recentTransactions: Array<{
    id: string;
    receiptNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: Array<{ name: string; qty: number }>;
    payments: Array<{ method: string; amount: number; bankName: string | null }>;
  }>;
  lowStockItems: Array<{ id: string; name: string; sku: string; currentStock: number; minStock: number }>;
  pendingTransfers: Array<{ id: string; transferNumber: string; fromLocation: string; toLocation: string; status: string }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToCart, clearCart } = useCart();
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [showCashBreakdown, setShowCashBreakdown] = useState(false);
  const [showMobileBreakdown, setShowMobileBreakdown] = useState(false);
  const [receivingTransferId, setReceivingTransferId] = useState<string | null>(null);

  const { data: result, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Silently check for due-today credits and send Telegram alerts (runs once per hour)
  useQuery({
    queryKey: ['credit-due-check'],
    queryFn: async () => {
      const res = await fetch('/api/credits/due-today');
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // Only run once per hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Mutation to receive transfer and get cart items
  const receiveTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      const res = await fetch(`/api/transfers/${transferId}/receive-for-sale`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to receive transfer');
      }
      return res.json();
    },
    onSuccess: (response) => {
      if (response.success && response.data.cartItems) {
        // Clear existing cart and add transfer items
        clearCart();
        
        // Add each item to cart
        for (const item of response.data.cartItems) {
          addToCart({
            itemId: item.itemId,
            name: item.name,
            sku: item.sku,
            qty: item.qty,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            locationId: item.locationId,
            locationName: item.locationName,
          });
        }
        
        // Invalidate dashboard data to refresh pending transfers
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        
        // Redirect to POS
        router.push('/pos');
      }
    },
    onError: (error) => {
      console.error('Failed to receive transfer:', error);
      toast.error(error.message || 'Failed to receive transfer');
    },
  });

  const handleReceiveTransfer = (transferId: string) => {
    setReceivingTransferId(transferId);
    receiveTransferMutation.mutate(transferId);
  };

  // Fetch bank transactions when a bank is selected
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

  const data = result?.data;
  const sessionFinancials = data?.sessionFinancials as SessionFinancials | undefined;
  const userRole = session?.user?.role || 'CASHIER';
  const showProfit = hasPermission(userRole, 'finance:profit');
  const showTransfers = hasPermission(userRole, 'transfers:read');
  const showFinancials = hasPermission(userRole, 'finance:read');
  const showSales = hasPermission(userRole, 'sales:read');
  const showInventory = hasPermission(userRole, 'items:read');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton h-20 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton h-48 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Current session overview</p>
        </div>
      </div>

      {/* Pending Transfers Alert Banner */}
      {showTransfers && data?.pendingTransfers && data.pendingTransfers.filter((t: any) => t.status === 'SENT').length > 0 && (
        (() => {
          const pendingTransfers = data.pendingTransfers.filter((t: any) => t.status === 'SENT');
          const canReceiveForSale = hasPermission(userRole, 'transfers:receive');
          const isCashier = userRole === 'CASHIER';
          
          // For cashiers with receive permission, directly receive and go to POS
          if (isCashier && canReceiveForSale && pendingTransfers.length === 1) {
            const transfer = pendingTransfers[0];
            return (
              <Card 
                className="mobile-card bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer"
                onClick={() => !receivingTransferId && handleReceiveTransfer(transfer.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center ${receivingTransferId === transfer.id ? '' : 'animate-pulse'}`}>
                    {receivingTransferId === transfer.id ? (
                      <div className="h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Truck className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {receivingTransferId === transfer.id ? 'Receiving Transfer...' : '1 Transfer Waiting to Receive'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {receivingTransferId === transfer.id ? 'Adding items to cart' : 'Tap to receive and go to POS'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-amber-500" />
                </CardContent>
              </Card>
            );
          }
          
          // For multiple transfers or non-cashiers, show list or link to transfers page
          if (isCashier && canReceiveForSale && pendingTransfers.length > 1) {
            return (
              <Card className="mobile-card bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
                      <Truck className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{pendingTransfers.length} Transfers Waiting</p>
                      <p className="text-xs text-muted-foreground">Tap a transfer to receive and go to POS</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pendingTransfers.map((transfer: any) => (
                      <div
                        key={transfer.id}
                        className="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors flex items-center justify-between"
                        onClick={() => !receivingTransferId && handleReceiveTransfer(transfer.id)}
                      >
                        <div>
                          <p className="text-sm font-medium">{transfer.transferNumber}</p>
                          <p className="text-xs text-muted-foreground">From: {transfer.fromLocation}</p>
                        </div>
                        {receivingTransferId === transfer.id ? (
                          <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // Default: Link to transfers page (for admins or users without receive permission)
          return (
            <Link href={pendingTransfers.length === 1 ? `/transfers/${pendingTransfers[0].id}` : '/transfers?status=SENT'}>
              <Card className="mobile-card bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
                    <Truck className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {pendingTransfers.length} Transfer(s) Waiting to Receive
                    </p>
                    <p className="text-xs text-muted-foreground">Tap to view and receive items</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-amber-500" />
                </CardContent>
              </Card>
            </Link>
          );
        })()
      )}

      {/* Quick Actions - Mobile */}
      <div className="grid grid-cols-4 gap-2 md:hidden">
        <Link href="/pos">
          <div className="mobile-card flex flex-col items-center justify-center py-4 hover:border-primary/30 transition-all">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center mb-2">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-medium">POS</span>
          </div>
        </Link>
        {hasPermission(userRole, 'items:write') && (
          <Link href="/inventory/new">
            <div className="mobile-card flex flex-col items-center justify-center py-4 hover:border-primary/30 transition-all">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-2">
                <Plus className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-xs font-medium">Add Item</span>
            </div>
          </Link>
        )}
        {showTransfers && (
          <Link href="/transfers/new">
            <div className="mobile-card flex flex-col items-center justify-center py-4 hover:border-primary/30 transition-all">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-2">
                <Truck className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-xs font-medium">Transfer</span>
            </div>
          </Link>
        )}
        <Link href="/inventory">
          <div className="mobile-card flex flex-col items-center justify-center py-4 hover:border-primary/30 transition-all">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-2">
              <ScanLine className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-xs font-medium">Scan</span>
          </div>
        </Link>
      </div>

      {/* Session Status Banner */}
      {!sessionFinancials?.hasActiveSession && (
        <Card className="mobile-card bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">No Active Session</p>
              <p className="text-xs text-muted-foreground">Open a session to start tracking financials</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Financials Cards */}
      {showFinancials && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {/* Cash In Hand */}
          <Card 
            className="mobile-card cursor-pointer hover:border-emerald-500/50 transition-all overflow-hidden"
            onClick={() => setShowCashBreakdown(!showCashBreakdown)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                </div>
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-emerald-500 truncate">
                {formatCurrencySmart(sessionFinancials?.cashInHand || 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Cash In Hand</p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="mobile-card overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
                <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-red-500 truncate">
                {formatCurrencySmart(sessionFinancials?.totalExpenses || 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Expenses</p>
            </CardContent>
          </Card>

          {/* Mobile Transfers */}
          <Card 
            className="mobile-card cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden"
            onClick={() => setShowMobileBreakdown(!showMobileBreakdown)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-blue-500 truncate">
                {formatCurrencySmart(sessionFinancials?.totalMobileTransfers || 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Mobile</p>
            </CardContent>
          </Card>

          {/* Session Sales */}
          <Card className="mobile-card overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground truncate">
                {formatCurrencySmart(data?.totalSales?.today || 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Sales</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cash In Hand Breakdown */}
      {showCashBreakdown && sessionFinancials?.cashInHandBreakdown && (
        <Card className="mobile-card bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-500" />
                Cash In Hand Breakdown
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowCashBreakdown(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span className="font-medium">{formatCurrency(sessionFinancials.cashInHandBreakdown.openingBalance)}</span></div>
            <div className="flex justify-between text-emerald-500"><span>+ Cash Sales</span><span>{formatCurrency(sessionFinancials.cashInHandBreakdown.cashSales)}</span></div>
            <div className="flex justify-between text-emerald-500"><span>+ Layaway Payments</span><span>{formatCurrency(sessionFinancials.cashInHandBreakdown.cashLayawayPayments)}</span></div>
            <div className="flex justify-between text-emerald-500"><span>+ Credit Payments</span><span>{formatCurrency(sessionFinancials.cashInHandBreakdown.cashCreditPayments)}</span></div>
            <div className="flex justify-between text-emerald-500"><span>+ Special Income</span><span>{formatCurrency(sessionFinancials.cashInHandBreakdown.specialIncome)}</span></div>
            <div className="flex justify-between text-emerald-500"><span>+ Bank to Cash</span><span>{formatCurrency(sessionFinancials.cashInHandBreakdown.bankToCash)}</span></div>
            <div className="flex justify-between text-red-500"><span>- Cash Expenses</span><span>{formatCurrency(sessionFinancials.cashInHandBreakdown.cashExpenses)}</span></div>
            <div className="flex justify-between text-red-500"><span>- Cash to Bank</span><span>{formatCurrency(sessionFinancials.cashInHandBreakdown.cashToBank)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold"><span>Total Cash In Hand</span><span className="text-emerald-500">{formatCurrency(sessionFinancials.cashInHandBreakdown.total)}</span></div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Transfer Breakdown */}
      {showMobileBreakdown && sessionFinancials?.mobileTransferBreakdown && (
        <Card className="mobile-card bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Mobile Transfer Breakdown
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowMobileBreakdown(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between text-blue-500"><span>Sales Payments</span><span>{formatCurrency(sessionFinancials.mobileTransferBreakdown.salesPayments)}</span></div>
            <div className="flex justify-between text-blue-500"><span>Layaway Payments</span><span>{formatCurrency(sessionFinancials.mobileTransferBreakdown.layawayPayments)}</span></div>
            <div className="flex justify-between text-blue-500"><span>Credit Payments</span><span>{formatCurrency(sessionFinancials.mobileTransferBreakdown.creditPayments)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold"><span>Total Mobile Transfers</span><span className="text-blue-500">{formatCurrency(sessionFinancials.mobileTransferBreakdown.total)}</span></div>
            <div className="flex justify-between text-muted-foreground text-xs"><span>Transaction Count</span><span>{sessionFinancials.mobileTransferBreakdown.transactionCount}</span></div>
          </CardContent>
        </Card>
      )}

      {/* Bank Accounts Section */}
      {showFinancials && sessionFinancials?.bankAccounts && sessionFinancials.bankAccounts.length > 0 && (
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Bank Accounts (Session)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessionFinancials.bankAccounts.map((bank) => (
                <div
                  key={bank.id}
                  className="p-4 bg-secondary rounded-xl cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => setSelectedBankId(bank.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{bank.bankName}</h4>
                    {bank.sessionTransactionCount > 0 && (
                      <span className="badge badge-info text-[10px]">{bank.sessionTransactionCount} txns</span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-primary">{formatCurrency(bank.currentBalance)}</p>
                  <p className="text-xs text-muted-foreground font-mono">{bank.accountNumber}</p>
                  {bank.sessionTransactionCount > 0 && (
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="text-emerald-500">+{formatCurrency(bank.sessionInflow)}</span>
                      <span className="text-red-500">-{formatCurrency(bank.sessionOutflow)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profit Stats Cards */}
      {showProfit && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card className="mobile-card overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <span className="text-[10px] sm:text-xs badge badge-success">{(data?.profitMetrics?.margin || 0).toFixed(0)}%</span>
              </div>
              <p className="text-sm sm:text-xl md:text-2xl font-bold text-foreground truncate">{formatCurrencySmart(data?.profitMetrics?.grossProfit || 0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Gross Profit</p>
            </CardContent>
          </Card>
          <Card className="mobile-card overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
                {(data?.profitMetrics?.netProfit || 0) >= 0 ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />}
              </div>
              <p className={`text-sm sm:text-xl md:text-2xl font-bold truncate ${(data?.profitMetrics?.netProfit || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrencySmart(data?.profitMetrics?.netProfit || 0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Net Profit</p>
            </CardContent>
          </Card>
          <Card className="mobile-card overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </div>
              </div>
              <p className="text-sm sm:text-xl md:text-2xl font-bold text-foreground">{data?.lowStockItems?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Low Stock</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Recent Transactions */}
        <Card className="mobile-card">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Recent Sales
              </CardTitle>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-7 px-2">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.slice(0, 4).map((tx: any) => (
                <div key={tx.id} className="p-2 sm:p-3 bg-secondary rounded-lg sm:rounded-xl space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                        {tx.items?.length > 0 
                          ? tx.items.map((i: any) => `${i.name} (×${i.qty})`).join(', ')
                          : tx.receiptNumber}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tx.payments?.map((p: any, idx: number) => (
                          <span key={idx} className={`badge text-[8px] sm:text-[10px] ${
                            p.method === 'CASH' ? 'badge-success' : 
                            p.method === 'CREDIT' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {String(p.method).replace(/_/g, ' ')}{p.bankName ? ` - ${p.bankName}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-xs sm:text-sm">{formatCurrencySmart(tx.totalAmount)}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No recent transactions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card className="mobile-card">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Sellers
              </CardTitle>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-7 px-2">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.topSellingItems && data.topSellingItems.length > 0 ? (
              data.topSellingItems.slice(0, 4).map((item: any, index: number) => (
                <div key={item.itemId} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-secondary rounded-lg sm:rounded-xl">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-md sm:rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-foreground truncate">{item.itemName}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{item.totalSold} sold</p>
                  </div>
                  <p className="font-bold text-primary text-xs sm:text-sm shrink-0">{formatCurrencySmart(item.revenue)}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="mobile-card">
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alert
              </CardTitle>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-7 px-2">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
            {data?.lowStockItems && data.lowStockItems.length > 0 ? (
              data.lowStockItems.slice(0, 4).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 sm:p-3 bg-amber-500/10 rounded-lg sm:rounded-xl border border-amber-500/20">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">{item.sku}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-amber-500 text-sm">{item.currentStock}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Min: {item.minStock}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">All items well stocked</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Transfers */}
        {showTransfers && (
          <Card className="mobile-card">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Pending Transfers
                </CardTitle>
                <Link href="/transfers">
                  <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-7 px-2">
                    View All <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
              {data?.pendingTransfers && data.pendingTransfers.length > 0 ? (
                data.pendingTransfers.slice(0, 4).map((transfer: any) => (
                  <Link key={transfer.id} href={`/transfers/${transfer.id}`}>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-secondary rounded-lg sm:rounded-xl hover:bg-secondary/80 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate">{transfer.transferNumber}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {transfer.fromLocation} → {transfer.toLocation}
                        </p>
                      </div>
                      <span className={`badge text-[10px] sm:text-xs shrink-0 ml-2 ${transfer.status === 'SENT' ? 'badge-warning' : 'badge-info'}`}>
                        {transfer.status}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Truck className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">No pending transfers</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Locations Overview - Desktop */}
      <Card className="mobile-card hidden md:block">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Locations Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.locationsOverview && data.locationsOverview.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {data.locationsOverview.map((location: any) => (
                <div key={location.id} className="p-4 bg-secondary rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{location.name}</h4>
                    <span className="badge badge-info text-[10px]">{location.type}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="font-medium">{location.itemCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Value</span>
                      <span className="font-medium text-primary">{formatCurrency(location.stockValue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No locations configured</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                {/* Summary */}
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
                {/* Transaction List */}
                <div className="space-y-2">
                  {bankTransactions?.data?.transactions?.map((tx: any) => (
                    <div key={tx.id} className="p-3 bg-secondary rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">{tx.reference || new Date(tx.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <p className={`font-bold ${tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
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
    </div>
  );
}
