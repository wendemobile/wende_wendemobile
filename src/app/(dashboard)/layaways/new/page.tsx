'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Search, ScanLine, Plus, Minus, Trash2, User, Package, DollarSign, Banknote, Smartphone, Split } from 'lucide-react';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/ui/barcode-scanner-lazy';
import { toast } from 'react-hot-toast';

interface CartItem {
  itemId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

type PaymentMethodType = 'CASH' | 'MOBILE_TRANSFER' | 'SPLIT';

export default function NewLayawayPage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [locationId, setLocationId] = useState('');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [bankAccountId, setBankAccountId] = useState('');
  const [reference, setReference] = useState('');
  // Split payment state
  const [splitCashAmount, setSplitCashAmount] = useState('');
  const [splitMobileAmount, setSplitMobileAmount] = useState('');
  const [splitBankAccountId, setSplitBankAccountId] = useState('');
  const [splitReference, setSplitReference] = useState('');

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      const data = await res.json();
      if (data.data?.length > 0 && !locationId) {
        setLocationId(data.data[0].id);
      }
      return data.data || [];
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

  const { data: customers } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: async () => {
      if (!customerSearch) return [];
      const res = await fetch(`/api/customers?query=${encodeURIComponent(customerSearch)}`);
      const data = await res.json();
      return data.data?.items || [];
    },
    enabled: customerSearch.length > 1,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['items-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const res = await fetch(`/api/items?query=${encodeURIComponent(searchQuery)}&pageSize=10`);
      const data = await res.json();
      return data.data?.items || [];
    },
    enabled: searchQuery.length > 0,
  });

  const createLayaway = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/layaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create layaway');
      }
      return result;
    },
    onSuccess: (result) => {
      router.push(`/layaways/${result.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleScan = useCallback((result: string) => {
    setSearchQuery(result);
  }, []);

  const addItem = (item: any) => {
    setItems(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i => i.itemId === item.id ? { ...i, qty: i.qty + 1, lineTotal: (i.qty + 1) * i.unitPrice } : i);
      }
      return [...prev, {
        itemId: item.id,
        name: item.name,
        sku: item.sku,
        qty: 1,
        unitPrice: parseFloat(item.unitPrice),
        lineTotal: parseFloat(item.unitPrice),
      }];
    });
    setSearchQuery('');
  };

  const updateQty = (itemId: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.itemId === itemId) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty, lineTotal: newQty * i.unitPrice };
      }
      return i;
    }));
  };

  const updatePrice = (itemId: string, newPriceStr: string) => {
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice < 0) return;

    setItems(prev => prev.map(i => {
      if (i.itemId === itemId) {
        return { ...i, unitPrice: newPrice, lineTotal: i.qty * newPrice };
      }
      return i;
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.itemId !== itemId));
  };

  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const deposit = parseFloat(depositAmount) || 0;
  const balance = total - deposit;

  // Auto-calculate remaining split amount
  const handleSplitCashChange = (val: string) => {
    setSplitCashAmount(val);
    const cashVal = parseFloat(val) || 0;
    const remaining = Math.max(0, deposit - cashVal);
    setSplitMobileAmount(remaining > 0 ? remaining.toFixed(2) : '');
  };

  const handleSplitMobileChange = (val: string) => {
    setSplitMobileAmount(val);
    const mobileVal = parseFloat(val) || 0;
    const remaining = Math.max(0, deposit - mobileVal);
    setSplitCashAmount(remaining > 0 ? remaining.toFixed(2) : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0 || !locationId) return;

    const payload: any = {
      customerId,
      locationId,
      items: items.map(i => ({ itemId: i.itemId, qty: i.qty, unitPrice: i.unitPrice })),
      depositAmount: deposit,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
    };

    if (deposit > 0) {
      if (paymentMethod === 'SPLIT') {
        const cashAmt = parseFloat(splitCashAmount) || 0;
        const mobileAmt = parseFloat(splitMobileAmount) || 0;

        if (Math.abs(cashAmt + mobileAmt - deposit) > 0.01) {
          toast.error('Split amounts must equal the deposit amount');
          return;
        }
        if (mobileAmt > 0 && !splitBankAccountId) {
          toast.error('Please select a bank account for the mobile transfer portion');
          return;
        }

        const depositPayments: any[] = [];
        if (cashAmt > 0) {
          depositPayments.push({ method: 'CASH', amount: cashAmt });
        }
        if (mobileAmt > 0) {
          depositPayments.push({
            method: 'MOBILE_TRANSFER',
            amount: mobileAmt,
            bankAccountId: splitBankAccountId,
            reference: splitReference || undefined,
          });
        }
        payload.depositPayments = depositPayments;
      } else if (paymentMethod === 'MOBILE_TRANSFER') {
        if (!bankAccountId) {
          toast.error('Please select a bank account for mobile transfer');
          return;
        }
        payload.depositPaymentMethod = 'MOBILE_TRANSFER';
        payload.depositBankAccountId = bankAccountId;
        payload.depositReference = reference || undefined;
      } else {
        payload.depositPaymentMethod = 'CASH';
      }
    }

    createLayaway.mutate(payload);
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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">New Layaway</h1>
          <p className="text-sm text-muted-foreground">Create a layaway order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location Selection */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Location *
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="" disabled>Select a location</option>
              {locations?.map((loc: any) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Customer Selection */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Customer *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setCustomerId(''); }}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            {customers && customers.length > 0 && !customerId && (
              <div className="border border-border rounded-xl overflow-hidden max-h-32 overflow-y-auto">
                {customers.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCustomerId(c.id); setCustomerSearch(c.name); }}
                    className="w-full p-3 text-left hover:bg-secondary transition-colors"
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    {c.phone && <span className="text-muted-foreground ml-2">• {c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Items *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary border-border"
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setShowScanner(true)} className="border-primary text-primary">
                <ScanLine className="h-5 w-5" />
              </Button>
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {searchResults.map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="text-left">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(parseFloat(item.unitPrice))}</p>
                  </button>
                ))}
              </div>
            )}

            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.itemId} className="p-3 bg-secondary rounded-xl">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground mr-1">Price:</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(item.itemId, e.target.value)}
                            className="h-7 w-20 text-xs px-2 bg-background border-border"
                          />
                          <span className="text-xs text-muted-foreground ml-1">× {item.qty}</span>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => removeItem(item.itemId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.itemId, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center font-medium text-sm">{item.qty}</span>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.itemId, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-bold text-primary">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No items added</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-secondary rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit</span>
                <span className="font-medium text-emerald-400">-{formatCurrency(deposit)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-medium text-foreground">Balance Due</span>
                <span className="font-bold text-primary">{formatCurrency(Math.max(0, balance))}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Initial Deposit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* Payment Method Selector - only show when deposit > 0 */}
            {deposit > 0 && (
              <>
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
                {paymentMethod === 'SPLIT' && (
                  <div className="space-y-3 p-3 bg-secondary/50 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground font-medium">Split deposit between Cash & Mobile Transfer</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                          <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                          Cash Amount
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
                          Mobile Amount
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
                        Math.abs(((parseFloat(splitCashAmount) || 0) + (parseFloat(splitMobileAmount) || 0)) - deposit) < 0.01
                          ? 'text-emerald-400 bg-emerald-400/10'
                          : 'text-orange-400 bg-orange-400/10'
                      }`}>
                        Sum: {formatCurrency((parseFloat(splitCashAmount) || 0) + (parseFloat(splitMobileAmount) || 0))} / {formatCurrency(deposit)}
                        {Math.abs(((parseFloat(splitCashAmount) || 0) + (parseFloat(splitMobileAmount) || 0)) - deposit) < 0.01 ? ' ✓' : ' — must equal deposit'}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Bank Account (for mobile portion) *</Label>
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
              </>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="bg-secondary border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/layaways" className="flex-1">
            <Button type="button" variant="outline" className="w-full h-11">Cancel</Button>
          </Link>
          <Button
            type="submit"
            className="flex-1 h-11 gradient-primary"
            disabled={!customerId || items.length === 0 || !locationId || createLayaway.isPending}
          >
            {createLayaway.isPending ? 'Creating...' : 'Create Layaway'}
          </Button>
        </div>
      </form>

      <BarcodeScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleScan} />
    </div>
  );
}
