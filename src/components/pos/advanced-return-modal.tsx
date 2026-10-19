import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { XCircle, X, Plus, Minus, AlertCircle, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ReturnItem {
  saleItemId: string;
  itemId: string;
  name: string;
  unitPrice: number;
  maxQty: number;
  returnQty: number;
}

interface RefundPayment {
  id: string;
  method: 'CASH' | 'MOBILE_TRANSFER' | 'CARD' | 'BANK';
  amount: number;
  bankAccountId?: string;
}

interface AdvancedReturnModalProps {
  sale: any;
  onClose: () => void;
  onConfirm: (items: any[], payments: any[]) => void;
  isProcessing: boolean;
}

export function AdvancedReturnModal({ sale, onClose, onConfirm, isProcessing }: AdvancedReturnModalProps) {
  // 1. Initialize Return Items State
  // Calculate max returnable quantity (sold qty minus already returned)
  const [returnItems, setReturnItems] = useState<ReturnItem[]>(() => {
    return (sale.items || []).map((item: any) => {
      let alreadyReturnedQty = 0;
      if (sale.returns) {
         for (const r of sale.returns) {
            const match = (r.items || []).find((ri: any) => ri.itemId === item.itemId);
            if (match) alreadyReturnedQty += Number(match.qty);
         }
      }
      return {
        saleItemId: item.id,
        itemId: item.itemId,
        name: item.item?.name || 'Unknown Item',
        unitPrice: Number(item.unitPrice),
        maxQty: Number(item.qty) - alreadyReturnedQty,
        returnQty: 0 // default to 0
      };
    }).filter((i: any) => i.maxQty > 0);
  });

  // 2. Initialize Refund Payments State
  const [refundPayments, setRefundPayments] = useState<RefundPayment[]>([
    { id: '1', method: 'CASH', amount: 0 }
  ]);

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      return data.data || [];
    },
  });

  const updateItemQty = (saleItemId: string, delta: number) => {
    setReturnItems(prev => prev.map(item => {
      if (item.saleItemId === saleItemId) {
        let newQty = item.returnQty + delta;
        if (newQty < 0) newQty = 0;
        if (newQty > item.maxQty) newQty = item.maxQty;
        return { ...item, returnQty: newQty };
      }
      return item;
    }));
  };

  const totalRefundAmount = returnItems.reduce((sum, item) => sum + (item.returnQty * item.unitPrice), 0);
  const totalAllocatedPayment = refundPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remainingToAllocate = totalRefundAmount - totalAllocatedPayment;

  const addPaymentMethod = () => {
    setRefundPayments(prev => [
      ...prev, 
      { id: Date.now().toString(), method: 'CASH', amount: remainingToAllocate > 0 ? remainingToAllocate : 0 }
    ]);
  };

  const updatePayment = (id: string, field: keyof RefundPayment, value: any) => {
    setRefundPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePayment = (id: string) => {
    setRefundPayments(prev => prev.filter(p => p.id !== id));
  };

  // If totalRefundAmount changes, and there's exactly 1 payment method, auto-update it
  useEffect(() => {
    setRefundPayments(prev => {
      if (prev.length === 1 && prev[0].amount !== totalRefundAmount) {
        return [{ ...prev[0], amount: totalRefundAmount }];
      }
      return prev;
    });
  }, [totalRefundAmount]);


  const handleConfirm = () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0).map(i => ({
      saleItemId: i.saleItemId,
      qty: i.returnQty
    }));
    
    onConfirm(itemsToReturn, refundPayments);
  };

  const isValid = 
     totalRefundAmount > 0 && 
     Math.abs(remainingToAllocate) < 0.05 && 
     refundPayments.every(p => p.amount > 0 && (!(p.method === 'MOBILE_TRANSFER' || p.method === 'BANK') || p.bankAccountId));

  if (returnItems.length === 0) {
     return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4">
           <Card className="w-full max-w-sm mobile-card p-4">
              <div className="text-center">
                 <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                 <h3 className="font-bold text-lg mb-2">No Items Available to Return</h3>
                 <p className="text-sm text-muted-foreground mb-4">All items in this sale have already been returned.</p>
                 <Button onClick={onClose} className="w-full">Close</Button>
              </div>
           </Card>
        </div>
     );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4">
      <Card className="w-full max-w-lg mobile-card max-h-[95dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 border-b border-border shrink-0">
          <CardTitle className="text-base sm:text-lg text-primary flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Process Return: {sale.receiptNumber}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-4">
          
          {/* Item Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Select Items to Return</h3>
            <div className="space-y-2">
              {returnItems.map(item => (
                 <div key={item.saleItemId} className={`p-3 rounded-lg border flex items-center justify-between ${item.returnQty > 0 ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}>
                    <div>
                       <p className="font-medium text-sm">{item.name}</p>
                       <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateItemQty(item.saleItemId, -1)}
                          disabled={item.returnQty <= 0}
                       >
                         <Minus className="h-3 w-3" />
                       </Button>
                       <span className="w-6 text-center text-sm font-medium">{item.returnQty}</span>
                       <span className="text-xs text-muted-foreground w-8 text-left">/ {item.maxQty}</span>
                       <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateItemQty(item.saleItemId, 1)}
                          disabled={item.returnQty >= item.maxQty}
                       >
                         <Plus className="h-3 w-3" />
                       </Button>
                    </div>
                 </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-border my-4" />

          {/* Refund Breakdown */}
          <div>
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-sm font-semibold">Refund Method</h3>
               <span className="text-lg font-bold text-primary">{formatCurrency(totalRefundAmount)}</span>
            </div>

            {totalRefundAmount > 0 ? (
               <div className="space-y-3">
                  {refundPayments.map((payment, idx) => (
                     <div key={payment.id} className="p-3 bg-secondary/50 rounded-xl border border-border flex flex-col gap-2">
                        <div className="flex gap-2">
                           <select 
                             className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm"
                             value={payment.method}
                             onChange={(e) => updatePayment(payment.id, 'method', e.target.value)}
                           >
                              <option value="CASH">Cash</option>
                              <option value="MOBILE_TRANSFER">Mobile Transfer</option>
                              <option value="CARD">Card</option>
                           </select>
                           <Input 
                             type="number" 
                             className="w-24 h-10 text-right" 
                             value={payment.amount}
                             onChange={(e) => updatePayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                           />
                           {refundPayments.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-destructive shrink-0"
                                onClick={() => removePayment(payment.id)}
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           )}
                        </div>

                        {/* Bank Account for Mobile Transfer */}
                        {(payment.method === 'MOBILE_TRANSFER' || payment.method === 'CARD' || payment.method === 'BANK') && (
                           <select
                              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                              value={payment.bankAccountId || ''}
                              onChange={(e) => updatePayment(payment.id, 'bankAccountId', e.target.value)}
                           >
                              <option value="">Select account to refund from...</option>
                              {Array.isArray(bankAccounts) && bankAccounts.map((acc: any) => (
                                 <option key={acc.id} value={acc.id}>
                                    {acc.bankName} (${Number(acc.currentBalance).toFixed(2)})
                                 </option>
                              ))}
                           </select>
                        )}
                     </div>
                  ))}

                  <div className="flex justify-between items-center">
                     <Button variant="ghost" size="sm" onClick={addPaymentMethod} className="text-xs h-8">
                       <Plus className="h-3 w-3 mr-1" /> Add split payment
                     </Button>
                     {Math.abs(remainingToAllocate) > 0.05 && (
                        <p className={`text-xs font-medium ${remainingToAllocate > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                           {remainingToAllocate > 0 ? `Unallocated: ${formatCurrency(remainingToAllocate)}` : `Over-allocated by ${formatCurrency(Math.abs(remainingToAllocate))}`}
                        </p>
                     )}
                  </div>
               </div>
            ) : (
               <div className="text-center py-4 bg-secondary/30 rounded-xl border border-dashed">
                  <p className="text-sm text-muted-foreground">Select items above to calculate refund.</p>
               </div>
            )}
          </div>

        </CardContent>

        <div className="p-3 sm:p-4 border-t border-border shrink-0 safe-area-bottom">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-11"
              disabled={isProcessing || !isValid}
              onClick={handleConfirm}
            >
              {isProcessing ? 'Processing...' : 'Confirm Return'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
