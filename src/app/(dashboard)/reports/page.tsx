'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  BarChart3, Wallet, ShoppingCart, Receipt, Gift, CreditCard, Layers,
  User, ChevronDown, ChevronUp, FileDown, QrCode
} from 'lucide-react';
// pdf-generator imports removed for lazy loading

import { Package, History, TrendingUp, ShoppingBag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/permissions';
import { useMemo, useEffect } from 'react';


const reportTypes = [
  { id: 'reconciliation', name: 'Reconciliation', description: 'Complete cash flow breakdown', icon: Wallet, color: 'amber', permission: 'reports:financial' },
  { id: 'daily-sales', name: 'Sales Summary', description: 'Sales with items and payments', icon: ShoppingCart, color: 'emerald', permission: 'reports:sales' },
  { id: 'stock-in-out', name: 'Stock Ledger', description: 'Detailed stock movements (In/Out)', icon: History, color: 'blue', permission: 'reports:inventory' },
  { id: 'inventory-status', name: 'Inventory Status', description: 'Current stock levels', icon: Package, color: 'cyan', permission: 'reports:inventory' },
  { id: 'stock-adjustment', name: 'Stock Adjustment', description: 'Item add/edit history', icon: History, color: 'orange', permission: 'reports:inventory' },
  { id: 'purchase-recommendation', name: 'Purchase Order', description: 'Low and out of stock items', icon: ShoppingBag, color: 'pink', permission: 'reports:inventory' },
  { id: 'inventory-movement', name: 'Inventory Movement', description: 'Fast/slow moving items', icon: TrendingUp, color: 'indigo', permission: 'reports:inventory' },
  { id: 'bulk-qr-labels', name: 'Bulk QR Labels', description: 'QR codes for all items by qty', icon: QrCode, color: 'violet', permission: 'reports:inventory' },
  { id: 'credits', name: 'Credits', description: 'Outstanding credits and payments', icon: CreditCard, color: 'blue', permission: 'reports:financial' },
  { id: 'layaways', name: 'Layaways', description: 'Active layaways and payments', icon: Layers, color: 'purple', permission: 'reports:financial' },
] as const;

const getColorClasses = (color: string, isSelected: boolean) => {
  const colors: Record<string, { bg: string; icon: string }> = {
    blue: { bg: isSelected ? 'bg-blue-500/20' : 'bg-blue-500/10', icon: 'text-blue-500' },
    purple: { bg: isSelected ? 'bg-purple-500/20' : 'bg-purple-500/10', icon: 'text-purple-500' },
    amber: { bg: isSelected ? 'bg-amber-500/20' : 'bg-amber-500/10', icon: 'text-amber-500' },
    cyan: { bg: isSelected ? 'bg-cyan-500/20' : 'bg-cyan-500/10', icon: 'text-cyan-500' },
    orange: { bg: isSelected ? 'bg-orange-500/20' : 'bg-orange-500/10', icon: 'text-orange-500' },
    emerald: { bg: isSelected ? 'bg-emerald-500/20' : 'bg-emerald-500/10', icon: 'text-emerald-500' },
    pink: { bg: isSelected ? 'bg-pink-500/20' : 'bg-pink-500/10', icon: 'text-pink-500' },
    indigo: { bg: isSelected ? 'bg-indigo-500/20' : 'bg-indigo-500/10', icon: 'text-indigo-500' },
    violet: { bg: isSelected ? 'bg-violet-500/20' : 'bg-violet-500/10', icon: 'text-violet-500' },
  };
  return colors[color] || colors.emerald;
};

export default function ReportsPage() {
  const { data: session } = useSession();
  const [selectedReport, setSelectedReport] = useState<string>('');

  const availableReports = useMemo(() => {
    if (!session?.user) return [];
    const role = session.user.role;
    // Admin gets everything regardless of specific permission mapping if they have reports:view and reports:export
    if (role === 'ADMIN') return reportTypes;

    return reportTypes.filter(report => hasPermission(role, report.permission as any));
  }, [session]);

  useEffect(() => {
    if (availableReports.length > 0 && !selectedReport) {
      setSelectedReport(availableReports[0].id);
    }
  }, [availableReports, selectedReport]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

  // Fetch current active session for session-scoped reconciliation
  const { data: currentPosSession } = useQuery({
    queryKey: ['current-session'],
    queryFn: async () => {
      const res = await fetch('/api/sessions/current');
      const data = await res.json();
      return data.data;
    },
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', selectedReport, startDate, endDate, currentPosSession?.id],
    queryFn: async () => {
      let url = `/api/reports/${selectedReport}?startDate=${startDate}&endDate=${endDate}`;
      // For reconciliation, pass sessionId to get session-scoped data
      if (selectedReport === 'reconciliation' && currentPosSession?.id) {
        url += `&sessionId=${currentPosSession.id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      return data.data;
    },
    enabled: !!selectedReport,
  });

  const toggleSaleExpand = (id: string) => {
    setExpandedSales(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;

    try {
      const pdfLib = await import('@/lib/pdf-generator');
      let doc;
      const filename = `${selectedReport}_${startDate}_${endDate}.pdf`;

      switch (selectedReport) {
        case 'reconciliation':
          doc = pdfLib.generateReconciliationPDF(reportData, startDate, endDate);
          break;
        case 'daily-sales':
          doc = pdfLib.generateSalesSummaryPDF(reportData, startDate, endDate);
          break;
        case 'inventory-status':
          doc = pdfLib.generateInventoryStatusPDF(reportData);
          break;
        case 'stock-adjustment':
          doc = pdfLib.generateStockAdjustmentPDF(reportData, startDate, endDate);
          break;
        case 'credits':
          doc = pdfLib.generateCreditsPDF(reportData, startDate, endDate);
          break;
        case 'layaways':
          doc = pdfLib.generateLayawaysPDF(reportData, startDate, endDate);
          break;
        case 'purchase-recommendation':
          doc = pdfLib.generatePurchaseRecommendationPDF(reportData);
          break;
        case 'inventory-movement':
          doc = pdfLib.generateInventoryMovementPDF(reportData, startDate, endDate);
          break;
        case 'stock-in-out':
          doc = pdfLib.generateStockMovementPDF(reportData, startDate, endDate);
          break;
        case 'bulk-qr-labels':
          doc = await pdfLib.generateBulkQRLabelsPDF(reportData);
          break;
        default:
          console.warn('PDF generation not implemented for this report type');
          return;
      }

      pdfLib.downloadPDF(doc, filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Generate and view business reports</p>
      </div>

      {/* Report Type Selection - responsive text and padding */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
        {availableReports.map((report) => {
          const isSelected = selectedReport === report.id;
          const colors = getColorClasses(report.color, isSelected);
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`flex-shrink-0 p-2 sm:p-3 rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all min-w-0 ${isSelected ? 'bg-primary/10 border-2 border-primary' : 'bg-secondary border-2 border-transparent'
                }`}
            >
              <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.icon}`} />
              </div>
              <span className="text-sm sm:text-base font-medium whitespace-nowrap">{report.name}</span>
            </button>
          );
        })}
      </div>

      {/* Date Range - responsive text and full width inputs */}
      <Card className="mobile-card">
        <CardContent className="p-2 sm:p-3">
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className="space-y-0.5 sm:space-y-1">
                <Label className="text-sm sm:text-base">Start</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 sm:h-11 bg-secondary text-sm sm:text-base touch-target-min w-full min-w-0 px-2 sm:px-3" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <Label className="text-sm sm:text-base">End</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 sm:h-11 bg-secondary text-sm sm:text-base touch-target-min w-full min-w-0 px-2 sm:px-3" />
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-10 sm:h-11 touch-target-min text-sm sm:text-base px-2 sm:px-3 min-w-0" onClick={() => { const t = new Date().toISOString().split('T')[0]; setStartDate(t); setEndDate(t); }}>Today</Button>
              <Button size="sm" variant="outline" className="flex-1 h-10 sm:h-11 touch-target-min text-sm sm:text-base px-2 sm:px-3 min-w-0" onClick={() => {
                const t = new Date();
                const w = new Date(t.getTime() - 7 * 24 * 60 * 60 * 1000);
                setStartDate(w.toISOString().split('T')[0]);
                setEndDate(t.toISOString().split('T')[0]);
              }}>7 Days</Button>
              {reportData && (
                <Button size="sm" onClick={handleDownloadPDF} className="gradient-primary flex-1 h-10 sm:h-11 touch-target-min text-sm sm:text-base px-2 sm:px-3 min-w-0">
                  <FileDown className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                  PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : selectedReport === 'reconciliation' && reportData ? (
        <div className="space-y-4">
          {/* Cash In Hand Breakdown - Same as Dashboard */}
          <Card className="mobile-card bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
                Cash In Hand Calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-base">
              <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span className="font-medium">{formatCurrency(reportData.summary?.openingBalance || 0)}</span></div>
              <div className="flex justify-between text-emerald-500"><span>+ Cash Sales</span><span>{formatCurrency(reportData.summary?.totalCashSales || 0)}</span></div>
              <div className="flex justify-between text-emerald-500"><span>+ Layaway Payments (Cash)</span><span>{formatCurrency(reportData.summary?.totalLayawayPaymentsCash || 0)}</span></div>
              <div className="flex justify-between text-emerald-500"><span>+ Credit Payments (Cash)</span><span>{formatCurrency(reportData.summary?.totalCreditPaymentsCash || 0)}</span></div>
              <div className="flex justify-between text-emerald-500"><span>+ Special Income</span><span>{formatCurrency(reportData.summary?.totalSpecialIncome || 0)}</span></div>
              <div className="flex justify-between text-emerald-500"><span>+ Bank to Cash</span><span>{formatCurrency(reportData.summary?.bankToCash || 0)}</span></div>
              <div className="flex justify-between text-red-500"><span>- Cash Expenses</span><span>{formatCurrency(reportData.summary?.totalCashExpenses || 0)}</span></div>
              <div className="flex justify-between text-red-500"><span>- Cash to Bank</span><span>{formatCurrency(reportData.summary?.cashToBank || 0)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Cash In Hand</span><span className="text-emerald-500">{formatCurrency(reportData.summary?.netCash || 0)}</span></div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(reportData.summary?.totalSales || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-red-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-red-400">{formatCurrency(reportData.summary?.totalExpenses || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-amber-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Special Income</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(reportData.summary?.totalSpecialIncome || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-primary/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Net Cash</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(reportData.summary?.netCash || 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Cancelled & Refund Summary */}
          {(reportData.summary?.totalCancelledSales > 0 || reportData.summary?.totalRefundedAmount > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Card className="mobile-card bg-red-500/10 border-red-500/20">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">Cancelled Sales</p>
                  <p className="text-xl font-bold text-red-400">{reportData.summary?.totalCancelledSales || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(reportData.summary?.totalCancelledAmount || 0)} value</p>
                </CardContent>
              </Card>
              <Card className="mobile-card bg-orange-500/10 border-orange-500/20">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">Total Refunded</p>
                  <p className="text-xl font-bold text-orange-400">{formatCurrency(reportData.summary?.totalRefundedAmount || 0)}</p>
                </CardContent>
              </Card>
              <Card className="mobile-card bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">Partial Returns</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(reportData.summary?.totalRefunds || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Affects cash balance</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sales Section */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-500" />
                Sales ({reportData.sales?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.sales?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No sales in this period</p>
              ) : (
                reportData.sales?.map((sale: any) => (
                  <div key={sale.id} className="bg-secondary/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSaleExpand(sale.id)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-base text-primary">{sale.receiptNumber}</span>
                          {sale.status === 'CANCELLED' && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold">
                              CANCELLED
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">{formatDateTime(sale.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {sale.salesman && <span className="flex items-center gap-1"><User className="h-3 w-3" />{sale.salesman}</span>}
                          <span>{sale.customer}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${sale.status === 'CANCELLED' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {formatCurrency(sale.totalAmount)}
                        </span>
                        {expandedSales.has(sale.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    {expandedSales.has(sale.id) && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                        <p className="text-sm font-medium text-muted-foreground">Items:</p>
                        {sale.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex flex-col mb-2 last:mb-0">
                            <div className="flex justify-between text-base">
                              <span>{item.name} × {item.qty}</span>
                              <span>{formatCurrency(item.lineTotal)}</span>
                            </div>
                            {item.originalLocation && (
                              <div className="text-sm text-muted-foreground flex justify-between">
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  From: {item.originalLocation}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {sale.discount > 0 && (
                          <div className="flex justify-between text-base text-red-500 mt-2 pt-2 border-t border-border/50">
                            <span>Discount</span>
                            <span>-{formatCurrency(sale.discount)}</span>
                          </div>
                        )}
                        <p className="text-sm font-medium text-muted-foreground mt-2">Payments:</p>
                        {sale.payments.map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-base">
                            <span className="flex items-center gap-1">
                              {String(p.method).replace(/_/g, ' ')}
                              {p.bankName && <span className="text-sm text-muted-foreground">({p.bankName})</span>}
                            </span>
                            <span className="text-emerald-400">{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                        {sale.status === 'CANCELLED' && sale.refundAmount > 0 && (
                          <>
                            <p className="text-sm font-medium text-muted-foreground mt-2">Refund:</p>
                            <div className="flex justify-between text-base">
                              <span className="flex items-center gap-1">
                                {sale.refundMethod || 'Unknown'}
                                {sale.cancelledBy && <span className="text-sm text-muted-foreground">(by {sale.cancelledBy})</span>}
                              </span>
                              <span className="text-red-400">-{formatCurrency(sale.refundAmount)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Refunds & Cancellations Section */}
          {reportData.refunds && reportData.refunds.length > 0 && (
            <Card className="mobile-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-orange-500" />
                  Refunds & Cancellations ({reportData.refunds.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportData.refunds.map((refund: any) => (
                  <div key={refund.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-primary">{refund.receiptNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          refund.type === 'FULL_CANCEL'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {refund.type === 'FULL_CANCEL' ? 'CANCELLED' : 'PARTIAL RETURN'}
                        </span>
                      </div>
                      <span className="font-bold text-red-400">-{formatCurrency(refund.refundAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{refund.refundMethod}</span>
                        <span>•</span>
                        <span>{refund.customer}</span>
                      </div>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {refund.cancelledBy}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(refund.cancelledAt)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Expenses Section */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-500" />
                Expenses ({reportData.expenses?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.expenses?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No expenses in this period</p>
              ) : (
                reportData.expenses?.map((expense: any) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{expense.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.payee && `${expense.payee} • `}
                        {expense.paymentMethod}
                        {expense.bankName && ` (${expense.bankName})`}
                      </p>
                    </div>
                    <span className="font-bold text-red-400">-{formatCurrency(expense.amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Special Income Section */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-500" />
                Special Income ({reportData.specialIncomes?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.specialIncomes?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No special income in this period</p>
              ) : (
                reportData.specialIncomes?.map((income: any) => (
                  <div key={income.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{income.category}</p>
                      <p className="text-sm text-muted-foreground">{income.description || 'No description'}</p>
                    </div>
                    <span className="font-bold text-amber-400">+{formatCurrency(income.amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Layaway Payments */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-500" />
                Layaway Payments ({reportData.layawayPayments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.layawayPayments?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No layaway payments in this period</p>
              ) : (
                reportData.layawayPayments?.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{payment.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.layawayNumber} • {payment.paymentMethod}
                        {payment.bankName && ` (${payment.bankName})`}
                      </p>
                    </div>
                    <span className="font-bold text-purple-400">+{formatCurrency(payment.amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Credit Payments */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Credit Payments ({reportData.creditPayments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.creditPayments?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No credit payments in this period</p>
              ) : (
                reportData.creditPayments?.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{payment.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.paymentMethod}
                        {payment.bankName && ` (${payment.bankName})`}
                      </p>
                    </div>
                    <span className="font-bold text-blue-400">+{formatCurrency(payment.amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : selectedReport === 'inventory-status' && reportData ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="mobile-card bg-cyan-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold text-cyan-400">{reportData.summary?.totalItems || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Stock Value</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(reportData.summary?.totalStockValue || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-primary/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Retail Value</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(reportData.summary?.totalRetailValue || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-amber-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Potential Profit</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(reportData.summary?.potentialProfit || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-orange-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold text-orange-400">{reportData.summary?.lowStockItems || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-red-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-xl font-bold text-red-400">{reportData.summary?.outOfStockItems || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Items List */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-500" />
                Inventory Items ({reportData.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.items?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No items found</p>
              ) : (
                reportData.items?.map((item: any) => (
                  <div key={item.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku} • {item.brand || 'No brand'} • {item.category || 'No category'}
                        </p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${item.totalStock === 0 ? 'bg-red-500/20 text-red-400' :
                        item.isLowStock ? 'bg-orange-500/20 text-orange-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                        {item.totalStock === 0 ? 'OUT' : item.isLowStock ? 'LOW' : 'OK'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-base">
                      <div>
                        <p className="text-sm text-muted-foreground">Stock</p>
                        <p className="font-medium">{item.totalStock}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="font-medium">{formatCurrency(item.costPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Value</p>
                        <p className="font-medium text-emerald-400">{formatCurrency(item.stockValue)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : selectedReport === 'stock-adjustment' && reportData ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Items Created</p>
                <p className="text-xl font-bold text-emerald-400">{reportData.summary?.itemsCreated || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-blue-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Items Updated</p>
                <p className="text-xl font-bold text-blue-400">{reportData.summary?.itemsUpdated || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-orange-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Changes</p>
                <p className="text-xl font-bold text-orange-400">{reportData.summary?.totalItemChanges || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-cyan-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Stock Added</p>
                <p className="text-xl font-bold text-cyan-400">+{reportData.summary?.stockIn || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-red-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Stock Removed</p>
                <p className="text-xl font-bold text-red-400">-{reportData.summary?.stockOut || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Item Changes */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-orange-500" />
                Item Changes ({reportData.itemAdjustments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.itemAdjustments?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No item changes in this period</p>
              ) : (
                reportData.itemAdjustments?.map((adj: any) => (
                  <div key={adj.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{adj.itemName}</p>
                        <p className="text-sm text-muted-foreground">SKU: {adj.itemSku}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${adj.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                        {adj.action}
                      </span>
                    </div>
                    <p className="text-base text-muted-foreground mb-1">{adj.changesText}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{adj.user}</span>
                      <span>{formatDateTime(adj.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Stock Quantity Changes */}
          {reportData.stockAdjustments?.length > 0 ? (
            <Card className="mobile-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4 text-cyan-500" />
                  Stock Quantity Changes ({reportData.stockAdjustments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportData.stockAdjustments?.map((adj: any) => (
                  <div key={adj.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{adj.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {adj.itemSku} • {adj.location}
                        </p>
                        {adj.reason && adj.reason !== '-' && (
                          <p className="text-sm text-amber-500 mt-1">Reason: {adj.reason}</p>
                        )}
                      </div>
                      <span className={`text-lg font-bold ${adj.qtyChange > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {adj.qtyChange > 0 ? '+' : ''}{adj.qtyChange}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{adj.oldQty} → {adj.newQty}</span>
                      <span>{adj.user} • {formatDateTime(adj.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="mobile-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-cyan-500" />
                  Stock Quantity Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-4">No stock quantity changes in this period</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : selectedReport === 'credits' && reportData ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="mobile-card bg-blue-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-xl font-bold text-blue-400">{reportData.summary?.totalCredits || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(reportData.summary?.totalCreditAmount || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-amber-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(reportData.summary?.totalPaid || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-red-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold text-red-400">{formatCurrency(reportData.summary?.totalOutstanding || 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">{reportData.summary?.activeCredits || 0}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{reportData.summary?.overdueCredits || 0}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{reportData.summary?.paidCredits || 0}</p>
                <p className="text-sm text-muted-foreground">Paid</p>
              </CardContent>
            </Card>
          </div>

          {/* Credits List */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Credit Details ({reportData.credits?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.credits?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No credits found</p>
              ) : (
                reportData.credits?.map((credit: any) => (
                  <div key={credit.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{credit.customerName}</p>
                        <p className="text-sm text-muted-foreground">{credit.customerPhone} • {credit.receiptNumber}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${credit.status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-400' :
                        credit.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                        {credit.status === 'CLOSED' ? 'PAID' : credit.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-base">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-medium">{formatCurrency(credit.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="font-medium text-emerald-400">{formatCurrency(credit.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="font-medium text-red-400">{formatCurrency(credit.balance)}</p>
                      </div>
                    </div>
                    {credit.dueDate && (
                      <p className={`text-sm mt-2 ${credit.status === 'OVERDUE' ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                        {credit.status === 'OVERDUE' ? '⚠️ ' : ''}Due: {formatDateTime(credit.dueDate)}
                      </p>
                    )}
                    {/* Payment History */}
                    {credit.payments && credit.payments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Payment History:</p>
                        {credit.payments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{formatDateTime(p.createdAt)} • {p.paymentMethod}{p.bankName ? ` (${p.bankName})` : ''}</span>
                            <span className="text-emerald-400 font-medium">+{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : selectedReport === 'layaways' && reportData ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="mobile-card bg-purple-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Layaways</p>
                <p className="text-xl font-bold text-purple-400">{reportData.summary?.totalLayaways || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(reportData.summary?.totalLayawayAmount || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-amber-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(reportData.summary?.totalPaid || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-red-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold text-red-400">{formatCurrency(reportData.summary?.totalOutstanding || 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">{reportData.summary?.activeLayaways || 0}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{reportData.summary?.completedLayaways || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{reportData.summary?.cancelledLayaways || 0}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </CardContent>
            </Card>
          </div>

          {/* Layaways List */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-500" />
                Layaway Details ({reportData.layaways?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.layaways?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No layaways found</p>
              ) : (
                reportData.layaways?.map((layaway: any) => (
                  <div key={layaway.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{layaway.customerName}</p>
                        <p className="text-sm text-muted-foreground">{layaway.customerPhone} • {layaway.layawayNumber}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${layaway.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        layaway.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                        {layaway.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-medium">{formatCurrency(layaway.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="font-medium text-emerald-400">{formatCurrency(layaway.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="font-medium text-red-400">{formatCurrency(layaway.balance)}</p>
                      </div>
                    </div>
                    {layaway.items?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-1">Items:</p>
                        {layaway.items.map((item: any, idx: number) => (
                          <p key={idx} className="text-sm">{item.name} × {item.qty}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : selectedReport === 'daily-sales' && reportData ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Net Sales</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(reportData.summary?.totalSales || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-orange-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Refunds</p>
                <p className="text-xl font-bold text-orange-400">{formatCurrency(reportData.summary?.totalRefunds || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-blue-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Gross Profit</p>
                <p className="text-xl font-bold text-blue-400">{formatCurrency(reportData.summary?.grossProfit || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-amber-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold text-amber-400">{reportData.summary?.totalTransactions || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-purple-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-xl font-bold text-purple-400">{reportData.summary?.totalItems || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(reportData.summary?.cashTotal || 0)}</p>
                <p className="text-sm text-muted-foreground">Cash</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-blue-400">{formatCurrency(reportData.summary?.mobileTotal || 0)}</p>
                <p className="text-sm text-muted-foreground">Mobile</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-amber-400">{formatCurrency(reportData.summary?.creditTotal || 0)}</p>
                <p className="text-sm text-muted-foreground">Credit</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales List */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                Sales ({reportData.sales?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.sales?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No sales in this period</p>
              ) : (
                reportData.sales?.map((sale: any) => (
                  <div key={sale.id} className="bg-secondary/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSaleExpand(sale.id)}
                      className="w-full p-3 flex items-center justify-between text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-primary">{sale.receiptNumber}</span>
                          {sale.status === 'CANCELLED' && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold">
                              CANCELLED
                            </span>
                          )}
                          {sale.status === 'REFUNDED' && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold">
                              REFUNDED
                            </span>
                          )}
                          {sale.status !== 'REFUNDED' && sale.returns && sale.returns.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-semibold">
                              PARTIAL RETURN
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">{formatDateTime(sale.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {sale.salesman && <span className="flex items-center gap-1"><User className="h-3 w-3" />{sale.salesman}</span>}
                          <span>{sale.customer}</span>
                          {sale.location && <span>• {sale.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {sale.returns && sale.returns.length > 0 && sale.status !== 'REFUNDED' ? (
                             <span className="font-bold text-foreground block">
                               {formatCurrency(sale.netAmount)} <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(sale.totalAmount)}</span>
                             </span>
                          ) : (
                             <span className={`font-bold block ${(sale.status === 'CANCELLED' || sale.status === 'REFUNDED') ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                               {formatCurrency(sale.totalAmount)}
                             </span>
                          )}
                          
                          {(sale.status !== 'CANCELLED' && sale.status !== 'REFUNDED') && sale.profit !== undefined && (
                            <span className="text-sm text-emerald-400">+{formatCurrency(sale.profit)}</span>
                          )}
                        </div>
                        {expandedSales.has(sale.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    {expandedSales.has(sale.id) && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                        <p className="text-sm font-medium text-muted-foreground">Items:</p>
                        {sale.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.name} × {item.qty}</span>
                            <span>{formatCurrency(item.lineTotal)}</span>
                          </div>
                        ))}
                        <p className="text-sm font-medium text-muted-foreground mt-2">Payments:</p>
                        {sale.payments.map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="flex items-center gap-1">
                              {String(p.method).replace(/_/g, ' ')}
                              {p.bankName && <span className="text-sm text-muted-foreground">({p.bankName})</span>}
                            </span>
                            <span className="text-emerald-400">{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                        {sale.status === 'CANCELLED' && sale.refundAmount > 0 && (
                          <>
                            <p className="text-sm font-medium text-muted-foreground mt-2">Refund:</p>
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                {sale.refundMethod || 'Unknown'}
                                {sale.cancelledBy && <span className="text-sm text-muted-foreground">(by {sale.cancelledBy})</span>}
                              </span>
                              <span className="text-red-400">-{formatCurrency(sale.refundAmount)}</span>
                            </div>
                          </>
                        )}
                        {sale.returns && sale.returns.length > 0 && (
                          <>
                            <p className="text-sm font-medium text-muted-foreground mt-2">Partial Returns:</p>
                            {sale.returns.map((r: any, idx: number) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="flex items-center gap-1 font-medium">
                                    {r.returnNumber} ({r.refundMethod})
                                  </span>
                                  <span className="text-red-400 font-bold">-{formatCurrency(r.totalAmount)}</span>
                                </div>
                                {r.items && r.items.length > 0 && (
                                  <div className="pl-4 text-xs text-muted-foreground border-l-2 border-border ml-1">
                                    {r.items.map((ri: any, rIdx: number) => (
                                      <div key={rIdx}>{ri.name} × {ri.qty} returned</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : selectedReport === 'purchase-recommendation' && reportData ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="mobile-card bg-pink-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Items to Reorder</p>
                <p className="text-xl font-bold text-pink-400">{reportData.summary?.totalItems || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-red-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-xl font-bold text-red-400">{reportData.summary?.outOfStockItems || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-amber-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold text-amber-400">{reportData.summary?.lowStockItems || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Potential Profit</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(reportData.summary?.totalPotentialProfit || 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Items List */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-pink-500" />
                Purchase Recommendations ({reportData.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.items?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No items need reordering</p>
              ) : (
                reportData.items?.map((item: any) => (
                  <div key={item.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku} • {item.brand || 'No brand'}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${item.isOutOfStock ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                        {item.isOutOfStock ? 'OUT' : 'LOW'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p className="font-medium">{item.totalStock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sold (30d)</p>
                        <p className="font-medium">{item.totalSold30Days}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Profit/Unit</p>
                        <p className="font-medium text-emerald-400">{formatCurrency(item.profitPerUnit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Order Qty</p>
                        <p className="font-medium text-primary">{item.suggestedOrderQty}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : selectedReport === 'inventory-movement' && reportData ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="mobile-card bg-indigo-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold text-indigo-400">{reportData.summary?.totalItems || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Units Sold</p>
                <p className="text-xl font-bold text-emerald-400">{reportData.summary?.totalUnitsSold || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-blue-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold text-blue-400">{formatCurrency(reportData.summary?.totalRevenue || 0)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-amber-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Profit</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(reportData.summary?.totalProfit || 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Movement Categories */}
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
            <Card className="mobile-card">
              <CardContent className="p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-400">{reportData.summary?.fastMovingCount || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Fast</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-2.5 text-center">
                <p className="text-lg font-bold text-blue-400">{reportData.summary?.normalMovingCount || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Normal</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-2.5 text-center">
                <p className="text-lg font-bold text-amber-400">{reportData.summary?.slowMovingCount || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Slow</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-2.5 text-center">
                <p className="text-lg font-bold text-orange-400">{reportData.summary?.verySlowMovingCount || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">V.Slow</p>
              </CardContent>
            </Card>
            <Card className="mobile-card col-span-2 xs:col-span-1">
              <CardContent className="p-2.5 text-center">
                <p className="text-lg font-bold text-red-400">{reportData.summary?.noMovementCount || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">None</p>
              </CardContent>
            </Card>
          </div>

          {/* Fast Moving Items */}
          {reportData.fastMoving?.length > 0 && (
            <Card className="mobile-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Fast Moving ({reportData.fastMoving?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportData.fastMoving?.slice(0, 10).map((item: any) => (
                  <div key={item.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <span className="text-sm px-2 py-1 rounded-full font-medium bg-emerald-500/20 text-emerald-400">
                        {item.avgDailySales}/day
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Sold</p>
                        <p className="font-medium">{item.totalSold}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p className="font-medium">{item.totalStock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-medium text-blue-400">{formatCurrency(item.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Days Left</p>
                        <p className={`font-medium ${item.daysOfStockRemaining < 7 ? 'text-red-400' : 'text-foreground'}`}>
                          {item.daysOfStockRemaining > 100 ? '100+' : item.daysOfStockRemaining}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Slow/No Movement Items */}
          {(reportData.slowMoving?.length > 0 || reportData.noMovement?.length > 0) && (
            <Card className="mobile-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-500" />
                  Slow/No Movement ({(reportData.slowMoving?.length || 0) + (reportData.noMovement?.length || 0)})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...(reportData.slowMoving || []), ...(reportData.noMovement || [])].slice(0, 10).map((item: any) => (
                  <div key={item.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full font-medium ${item.movementCategory === 'NO_MOVEMENT' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                        {item.movementCategory === 'NO_MOVEMENT' ? 'No Sales' : 'Slow'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-sm text-muted-foreground">Stock</p>
                        <p className="font-medium">{item.totalStock}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stock Value</p>
                        <p className="font-medium">{formatCurrency(item.totalStock * item.costPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sold</p>
                        <p className="font-medium">{item.totalSold}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : selectedReport === 'stock-in-out' && reportData ? (
        <Card className="mobile-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-4 w-4 text-blue-500" />
              Stock Movements ({reportData.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No movements found in this period</p>
            ) : (
              reportData.map((movement: any) => (
                <div key={movement.id} className="p-3 bg-secondary/50 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{movement.item}</p>
                      <p className="text-sm text-muted-foreground">SKU: {movement.sku} • {movement.location}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm px-2 py-1 rounded-full font-bold ${movement.qtyChange > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {movement.qtyChange > 0 ? '+' : ''}{movement.qtyChange}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground pt-1 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="font-medium text-primary/80 uppercase text-[10px] sm:text-xs">{movement.type.replace('_', ' ')}</span>
                      <span>{movement.reference}</span>
                    </div>
                    <div className="text-right">
                      <p>{formatDateTime(movement.date)}</p>
                      <p className="flex items-center gap-1 justify-end"><User className="h-3 w-3" /> {movement.user}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : selectedReport === 'bulk-qr-labels' && reportData ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="mobile-card bg-violet-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold text-violet-400">{reportData.items?.length || 0}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card bg-emerald-500/10">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Total Labels</p>
                <p className="text-xl font-bold text-emerald-400">{reportData.totalLabels || 0}</p>
              </CardContent>
            </Card>
            {reportData.locationName && (
              <Card className="mobile-card bg-blue-500/10">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-lg font-bold text-blue-400 truncate">{reportData.locationName}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Card */}
          <Card className="mobile-card bg-violet-500/5 border-violet-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <QrCode className="h-8 w-8 text-violet-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">QR Code Labels Ready</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the PDF button above to download {reportData.totalLabels || 0} QR code labels.
                    Each item will have QR codes equal to its stock quantity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card className="mobile-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="h-4 w-4 text-violet-500" />
                Items ({reportData.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reportData.items?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No items with stock found</p>
              ) : (
                reportData.items?.map((item: any) => (
                  <div key={item.id} className="p-3 bg-secondary/50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku} • Barcode: {item.barcode}</p>
                      </div>
                      <span className="text-sm px-2 py-1 rounded-full font-medium bg-violet-500/20 text-violet-400">
                        {item.stockQuantity} labels
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium text-emerald-400">{formatCurrency(item.unitPrice)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="mobile-card">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Select a report type</p>
            <p className="text-muted-foreground text-sm mt-1">Choose a report and date range to view data</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
