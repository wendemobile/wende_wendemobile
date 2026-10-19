'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Printer,
  ScanLine, X, CreditCard, ChevronUp, ChevronDown, MapPin, CheckCircle2, AlertCircle,
  History, XCircle, Receipt, User
} from 'lucide-react';
import { PaymentModal } from '@/components/pos/payment-modal';
import { Receipt as ReceiptComponent } from '@/components/pos/receipt';
import { BarcodeScanner } from '@/components/ui/barcode-scanner-lazy';
import { ScrollableContainer } from '@/components/ui/scrollable-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useCart } from '@/contexts/cart-context';
import { useScan, ScannedItem } from '@/hooks/use-scan';
import { LocationSelectDialog } from '@/components/inventory/location-select-dialog';
import { useSession } from 'next-auth/react';
import { AdvancedReturnModal } from '@/components/pos/advanced-return-modal';

export default function POSPage() {
  const { data: sessionData } = useSession();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [showCart, setShowCart] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [showSaleHistory, setShowSaleHistory] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [returnSaleData, setReturnSaleData] = useState<any>(null);
  const [locationSelectItem, setLocationSelectItem] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const canProcessReturns = sessionData?.user?.role === 'ADMIN' || sessionData?.user?.role === 'CASHIER';

  const { cart, addToCart, updateQty, setQty, updatePrice, removeFromCart, clearCart, total } = useCart();

  // Auto-open cart when coming from inventory (via URL param) or when cart has items on mobile
  useEffect(() => {
    const shouldShowCart = searchParams.get('showCart') === 'true';
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (!hasAutoOpened && (shouldShowCart || (cart.length > 0 && isMobile))) {
      setShowCart(true);
      setHasAutoOpened(true);
    }
  }, [cart.length, hasAutoOpened, searchParams]);

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      const data = await res.json();
      return data.data || [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      const data = await res.json();
      return data.data || [];
    },
  });

  // Fetch session sales for history
  const { data: sessionSales, isLoading: salesLoading } = useQuery({
    queryKey: ['session-sales', historySearchQuery],
    queryFn: async () => {
      const searchParam = historySearchQuery 
        ? `&search=${encodeURIComponent(historySearchQuery)}` 
        : '&sessionOnly=true';
      const res = await fetch(`/api/sales?status=COMPLETED,CANCELLED,REFUNDED&pageSize=50${searchParam}`);
      const data = await res.json();
      return data.data?.sales || [];
    },
    enabled: showSaleHistory,
  });

  useEffect(() => {
    if (locations?.length > 0 && !selectedLocationId) {
      const showroom = locations.find((l: any) => l.type === 'SHOWROOM');
      setSelectedLocationId(showroom?.id || locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Process Return Mutation
  const returnSaleMutation = useMutation({
    mutationFn: async ({ saleId, items, payments }: { saleId: string; items: any[]; payments: any[] }) => {
      const res = await fetch(`/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, items, payments }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to process return');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-sales'] });
      setReturnSaleData(null);
      setScanFeedback({ type: 'success', message: 'Return processed successfully' });
      setTimeout(() => setScanFeedback(null), 3000);
    },
    onError: (error: any) => {
      setScanFeedback({ type: 'error', message: error.message });
      setTimeout(() => setScanFeedback(null), 3000);
    },
  });

  const handleLocationSelect = useCallback((locationId: string, locationName: string) => {
    if (locationSelectItem) {
      addToCart({
        itemId: locationSelectItem.id,
        name: locationSelectItem.name,
        sku: locationSelectItem.sku,
        unitPrice: locationSelectItem.unitPrice ? parseFloat(locationSelectItem.unitPrice) : locationSelectItem.unitPrice,
        costPrice: locationSelectItem.costPrice ? parseFloat(locationSelectItem.costPrice) : locationSelectItem.costPrice,
        locationId,
        locationName,
        imageUrl: locationSelectItem.imageUrl || (locationSelectItem.image?.path ? `/api/items/${locationSelectItem.id}/image` : undefined),
      });
      setLocationSelectItem(null);
      setScanFeedback({ type: 'success', message: `Added ${locationSelectItem.name}` });
      setTimeout(() => setScanFeedback(null), 2000);
      if (typeof window !== 'undefined' && window.innerWidth < 768) setShowCart(true);
    }
  }, [locationSelectItem, addToCart]);

  const handleScannedItemFound = useCallback((item: ScannedItem) => {
    const stocksWithQty = item.stocksByLocation.filter((s) => s.availableQuantity > 0);

    if (item.totalStock <= 0 || stocksWithQty.length === 0) {
      setScanFeedback({ type: 'error', message: `${item.name} is out of stock` });
      setTimeout(() => setScanFeedback(null), 3000);
      return;
    }

    if (stocksWithQty.length === 1) {
      const locationWithStock = stocksWithQty[0];
      addToCart({
        itemId: item.id,
        name: item.name,
        sku: item.sku,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        locationId: locationWithStock.locationId,
        locationName: locationWithStock.locationName,
        imageUrl: item.imageUrl,
      });

      setScanFeedback({ type: 'success', message: `Added ${item.name}` });
      setTimeout(() => setScanFeedback(null), 2000);

      if (typeof window !== 'undefined' && window.innerWidth < 768) setShowCart(true);
    } else {
      setLocationSelectItem(item);
    }
  }, [addToCart]);

  const handleItemNotFound = useCallback((barcode: string) => {
    setScanFeedback({ type: 'error', message: `Item not found: ${barcode}` });
    setTimeout(() => setScanFeedback(null), 3000);
  }, []);

  const {
    showScanner,
    openScanner,
    closeScanner,
    handleScan: handleCameraScan,
    isSearching: isScanSearching,
    isPhysicalScanning,
  } = useScan({
    onItemFound: handleScannedItemFound,
    onItemNotFound: handleItemNotFound,
    enabled: true,
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/items?search=${encodeURIComponent(searchQuery)}&pageSize=20`);
      const data = await res.json();
      return data.data?.items || [];
    },
    enabled: searchQuery.length > 0,
  });

  const handleAddToCart = (item: any) => {
    const stocksByLocation = item.stocksByLocation || [];
    const stocksWithQty = stocksByLocation.filter((s: any) => s.availableQuantity > 0);

    if (stocksWithQty.length === 0) return;

    if (stocksWithQty.length === 1) {
      const locationWithStock = stocksWithQty[0];
      addToCart({
        itemId: item.id,
        name: item.name,
        sku: item.sku,
        unitPrice: parseFloat(item.unitPrice),
        costPrice: parseFloat(item.costPrice),
        locationId: locationWithStock.locationId,
        locationName: locationWithStock.locationName,
        imageUrl: item.image?.path ? `/api/items/${item.id}/image` : undefined,
      });
      if (typeof window !== 'undefined' && window.innerWidth < 768) setShowCart(true);
    } else {
      setLocationSelectItem(item);
    }
  };

  const handlePaymentComplete = async (payments: any[]) => {
    if (isProcessing || !selectedLocationId) return;
    setIsProcessing(true);

    try {
      const saleRes = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          locationId: selectedLocationId,
          salesmanId: selectedSalesmanId || undefined
        }),
      });

      const saleResponse = await saleRes.json();
      if (!saleRes.ok) {
        throw new Error(saleResponse.error?.message || 'Failed to create sale');
      }
      const { data: sale } = saleResponse;

      for (const item of cart) {
        const itemRes = await fetch(`/api/sales/${sale.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.itemId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            locationId: item.locationId,
          }),
        });
        if (!itemRes.ok) {
          const err = await itemRes.json();
          throw new Error(err.error?.message || `Failed to add ${item.name}`);
        }
      }

      const finalizeRes = await fetch(`/api/sales/${sale.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: payments.map(p => ({
            method: p.method,
            amount: p.amount,
            bankAccountId: p.bankAccountId,
            reference: p.reference,
            dueDate: p.dueDate,
            customerName: p.customerName,
            customerPhone: p.customerPhone,
          })),
          discount: 0,
        }),
      });

      if (!finalizeRes.ok) {
        const error = await finalizeRes.json();
        throw new Error(error.error?.message || 'Failed to finalize sale');
      }

      const { data: finalSale } = await finalizeRes.json();
      const creditPayment = payments.find(p => p.method === 'CREDIT');

      const saleData = {
        receiptNumber: finalSale.receiptNumber,
        date: new Date(finalSale.createdAt),
        items: cart.map(c => ({ name: c.name, qty: c.qty, unitPrice: c.unitPrice, lineTotal: c.lineTotal })),
        subtotal: total,
        discount: 0,
        total: total,
        payments: payments.map(p => ({ method: p.method, amount: p.amount })),
        customer: creditPayment?.customerName || '',
      };

      setCompletedSale(saleData);
      setShowPayment(false);
      setShowCart(false);
      clearCart();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;padding:10px;}</style></head><body>${receiptRef.current.innerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="h-[calc(100dvh-8rem)] md:h-[calc(100dvh-6rem)] flex flex-col md:flex-row gap-2 sm:gap-4 relative">
      {/* Scan Feedback Toast */}
      {scanFeedback && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${scanFeedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {scanFeedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-medium">{scanFeedback.message}</span>
        </div>
      )}

      {isPhysicalScanning && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium animate-pulse">
          Scanning...
        </div>
      )}

      {isScanSearching && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium">
          Looking up item...
        </div>
      )}

      {/* Products Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col mobile-card overflow-hidden">
          <CardHeader className="p-2.5 sm:p-3 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <CardTitle className="text-responsive-lg shrink-0">Products</CardTitle>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-end min-w-0">
                <Select value={selectedSalesmanId} onValueChange={setSelectedSalesmanId}>
                  <SelectTrigger className="h-10 flex-1 max-w-[140px] sm:max-w-[160px] bg-secondary text-xs sm:text-sm px-2.5">
                    <SelectValue placeholder="Salesman" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaleHistory(true)}
                  className="h-10 w-10 sm:w-auto sm:px-3 p-0 border-amber-500 text-amber-500 hover:bg-amber-500/10 shrink-0"
                  title="Sales History"
                >
                  <History className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline text-sm">History</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openScanner}
                  className="h-10 w-10 sm:w-auto sm:px-3 p-0 border-primary text-primary shrink-0"
                  title="Scan Barcode"
                >
                  <ScanLine className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline text-sm">Scan</span>
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-10 text-sm bg-secondary border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollableContainer className="p-2 sm:p-3">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (<div key={i} className="skeleton h-24 rounded-xl" />))}
                </div>
              ) : items?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {items.map((item: any) => {
                    const totalStock = item.totalStock || 0;
                    return (
                      <button key={item.id} onClick={() => handleAddToCart(item)} disabled={totalStock <= 0}
                        className={`product-card touch-target-min ${totalStock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <p className="font-medium text-foreground text-responsive-sm truncate">{item.name}</p>
                        <p className="text-responsive-xs text-muted-foreground font-mono truncate">{item.sku}</p>
                        <p className="price-display mt-1 whitespace-nowrap">{formatCurrency(parseFloat(item.unitPrice))}</p>
                        <span className={`badge mt-1 ${totalStock > 0 ? 'badge-success' : 'badge-error'}`}>
                          {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8"><p className="text-muted-foreground text-responsive-sm">No products found</p></div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-responsive-sm">Search or scan products</p>
                  <p className="text-muted-foreground text-xs mt-1">Physical scanner ready - just scan!</p>
                </div>
              )}
            </ScrollableContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Floating Cart Button - Always visible when cart is hidden */}
      {!showCart && cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="md:hidden fixed bottom-20 left-3 right-3 z-40 h-14 px-4 rounded-2xl gradient-primary text-white shadow-2xl glow-primary flex items-center justify-between active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium opacity-90">{cart.length} {cart.length === 1 ? 'item' : 'items'} in cart</p>
              <p className="text-base font-bold leading-tight">{formatCurrency(total)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-semibold">Open Cart</span>
            <ChevronUp className="h-4 w-4" />
          </div>
        </button>
      )}

      {/* Mobile Cart Backdrop */}
      {showCart && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-40 animate-in fade-in"
          onClick={() => setShowCart(false)}
        />
      )}

      {/* Cart Panel */}
      <div className={`
        fixed md:relative inset-x-0 bottom-0 md:inset-auto md:w-80 lg:w-96 
        flex flex-col z-50 md:z-40 transition-transform duration-300 ease-out
        ${showCart ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
      `}>
        {/* Mobile Cart Header - Drag Handle */}
        <div
          className="md:hidden bg-card rounded-t-2xl border-t border-x border-border pt-2 pb-2 cursor-pointer active:bg-secondary/50 transition-colors"
          onClick={() => setShowCart(!showCart)}
        >
          {/* Drag indicator */}
          <div className="w-10 h-1 bg-muted-foreground/40 rounded-full mx-auto mb-3" />

          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{cart.length} items</p>
                <p className="text-xs text-muted-foreground">Tap to {showCart ? 'hide' : 'show'} cart</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
              {showCart ? (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Cart Content */}
        <Card className="flex-1 flex flex-col mobile-card rounded-t-none md:rounded-2xl max-h-[78dvh] md:max-h-[calc(100dvh-8rem)] min-h-0 overflow-hidden shadow-2xl border-t-0 md:border-t">
          {/* Desktop Cart Header */}
          <CardHeader className="hidden md:flex flex-row items-center justify-between p-3 pb-2 shrink-0 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Cart ({cart.length})
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive h-8 text-xs hover:bg-destructive/10">
                Clear All
              </Button>
            )}
          </CardHeader>

          {/* Mobile Clear Button */}
          {cart.length > 0 && (
            <div className="md:hidden flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
              <span className="text-sm text-muted-foreground">Cart Items</span>
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive h-7 text-xs hover:bg-destructive/10">
                Clear All
              </Button>
            </div>
          )}

          {/* Scrollable Cart Items */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            <div className="p-3 pb-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Cart is empty</p>
                  <p className="text-xs text-muted-foreground mt-1">Add items from products</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-secondary/50 rounded-xl border border-border p-3">
                      {/* Item Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm leading-tight">{item.name}</p>
                          {item.locationName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{item.locationName}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 -mt-1 -mr-1"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Price & Quantity Row */}
                      <div className="flex items-center gap-2">
                        {/* Price */}
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-xs text-muted-foreground">$</span>
                          <input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            value={item.unitPrice === 0 ? '' : item.unitPrice}
                            placeholder="0"
                            onChange={(e) => {
                              const v = e.target.value;
                              updatePrice(item.id, v === '' ? 0 : parseFloat(v) || 0);
                            }}
                            className="w-full h-9 text-sm bg-background border border-border rounded-lg px-2 text-center font-medium"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => updateQty(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            inputMode="decimal"
                            value={item.qty === 0 ? '' : item.qty}
                            placeholder="1"
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === '') return;
                              const parsed = parseFloat(v);
                              if (!Number.isNaN(parsed) && parsed > 0) setQty(item.id, parsed);
                            }}
                            className="w-14 h-9 text-sm bg-background border border-border rounded-lg px-1 text-center font-medium"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => updateQty(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Line Total */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">Subtotal</span>
                        <p className="font-bold text-primary text-base">{formatCurrency(item.lineTotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Footer */}
          <div className="p-3 pb-4 md:pb-3 border-t border-border bg-card shrink-0 safe-area-bottom">
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-medium text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
            <Button
              className="w-full gradient-primary glow-sm h-12 text-base font-semibold"
              disabled={cart.length === 0}
              onClick={() => setShowPayment(true)}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Checkout
            </Button>

            {/* Mobile: Hide cart button */}
            <Button
              variant="ghost"
              className="w-full mt-2 md:hidden h-10 text-muted-foreground"
              onClick={() => setShowCart(false)}
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Hide Cart
            </Button>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <BarcodeScanner isOpen={showScanner} onClose={closeScanner} onScan={handleCameraScan} />
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} total={total} onComplete={handlePaymentComplete} />

      {/* Sale Complete Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="w-full max-w-sm mobile-card max-h-[95dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 border-b border-border shrink-0">
              <CardTitle className="text-lg text-emerald-500 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Sale Complete!
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setCompletedSale(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4">
              <div ref={receiptRef}><ReceiptComponent {...completedSale} /></div>
            </CardContent>
            <div className="p-3 sm:p-4 border-t border-border shrink-0 safe-area-bottom">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setCompletedSale(null)}>Done</Button>
                <Button className="flex-1 h-11 gradient-primary" onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4 mr-2" />Print
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sale History Modal */}
      {showSaleHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="w-full max-w-lg mobile-card max-h-[95dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden">
            <CardHeader className="flex flex-col gap-3 p-3 sm:p-4 border-b border-border shrink-0">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-amber-500" />
                  Sales History
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-10 w-10 -mr-2" onClick={() => setShowSaleHistory(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Find any receipt number (e.g. RCP-2024...)"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {salesLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
                </div>
              ) : !sessionSales || sessionSales.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No sales in this session</p>
                  <p className="text-xs text-muted-foreground mt-1">Sales will appear here after checkout</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {sessionSales.map((sale: any) => {
                    const isExpanded = expandedSaleId === sale.id;
                    const isCancelled = sale.status === 'CANCELLED' || sale.status === 'REFUNDED';

                    return (
                      <div key={sale.id} className={`rounded-xl border overflow-hidden ${isCancelled ? 'bg-red-500/5 border-red-500/20' : 'bg-secondary/50 border-border'}`}>
                        {/* Sale Header - Clickable */}
                        <button
                          onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                          className="w-full p-3 flex items-center justify-between text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-primary font-medium">{sale.receiptNumber}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCancelled ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                {sale.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{formatDateTime(sale.createdAt)}</span>
                              {sale.salesman && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {sale.salesman.fullName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isCancelled ? 'text-red-500 line-through' : 'text-foreground'}`}>
                              {formatCurrency(Number(sale.totalAmount))}
                            </span>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-3 border-t border-border/50">
                            {/* Items */}
                            <div className="pt-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Items ({sale.items?.length || 0})</p>
                              <div className="space-y-1">
                                {sale.items?.map((item: any, idx: number) => {
                                  let returnedQty = 0;
                                  if (sale.returns) {
                                    sale.returns.forEach((r: any) => {
                                      const match = r.items?.find((ri: any) => ri.itemId === item.itemId);
                                      if (match) returnedQty += Number(match.qty);
                                    });
                                  }
                                  
                                  return (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-foreground">
                                        {item.item?.name || 'Unknown'} × {Number(item.qty)}
                                        {returnedQty > 0 && <span className="text-red-500 ml-2">(Returned: {returnedQty})</span>}
                                      </span>
                                      <span className="text-muted-foreground">{formatCurrency(Number(item.lineTotal))}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Payments */}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Payments</p>
                              <div className="space-y-1">
                                {sale.payments?.map((payment: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-foreground">
                                      {payment.method}
                                      {payment.bankAccount && <span className="text-muted-foreground"> ({payment.bankAccount.bankName})</span>}
                                    </span>
                                    <span className="text-emerald-500">{formatCurrency(Number(payment.amount))}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Partial Returns Info */}
                            {sale.returns && sale.returns.length > 0 && (
                              <div className="p-2 bg-red-500/10 rounded-lg">
                                <p className="text-xs font-medium text-red-500 mb-1">Returns / Refunds</p>
                                <div className="space-y-2">
                                  {sale.returns.map((r: any, rIdx: number) => (
                                    <div key={rIdx} className="border-b border-red-500/10 last:border-0 pb-2 last:pb-0">
                                      <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground text-xs">{r.returnNumber}</span>
                                        <span className="text-red-500 font-medium">{formatCurrency(Number(r.totalAmount))}</span>
                                      </div>
                                      <div className="space-y-1">
                                        {r.payments?.map((p: any, pIdx: number) => (
                                          <div key={pIdx} className="flex justify-between text-xs pl-2 border-l-2 border-red-500/20">
                                            <span className="text-muted-foreground">{p.paymentMethod}</span>
                                            <span className="text-red-500/80">{formatCurrency(Number(p.amount))}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Refund Info (if cancelled legacy) */}
                            {isCancelled && sale.refundAmount && (!sale.returns || sale.returns.length === 0) && (
                              <div className="p-2 bg-red-500/10 rounded-lg">
                                <p className="text-xs font-medium text-red-500 mb-1">Refunded (Full Cancel)</p>
                                <div className="flex justify-between text-sm">
                                  <span className="text-foreground">{sale.refundMethod || 'CASH'}</span>
                                  <span className="text-red-500 font-medium">{formatCurrency(Number(sale.refundAmount))}</span>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            {(!isCancelled && canProcessReturns) && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-10 text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => {
                                    setReturnSaleData(sale);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Return / Refund Items
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Return Modal */}
      {returnSaleData && (
         <AdvancedReturnModal
            sale={returnSaleData}
            onClose={() => setReturnSaleData(null)}
            isProcessing={returnSaleMutation.isPending}
            onConfirm={(items, payments) => {
               returnSaleMutation.mutate({
                  saleId: returnSaleData.id,
                  items,
                  payments
               });
            }}
         />
      )}
      {/* Location Select Dialog */}
      {locationSelectItem && (
        <LocationSelectDialog
          isOpen={!!locationSelectItem}
          onClose={() => setLocationSelectItem(null)}
          item={{
            id: locationSelectItem.id,
            name: locationSelectItem.name,
            sku: locationSelectItem.sku,
            unitPrice: locationSelectItem.unitPrice ? parseFloat(locationSelectItem.unitPrice) : locationSelectItem.unitPrice,
            costPrice: locationSelectItem.costPrice ? parseFloat(locationSelectItem.costPrice) : locationSelectItem.costPrice,
            imageUrl: locationSelectItem.imageUrl || (locationSelectItem.image?.path ? `/api/items/${locationSelectItem.id}/image` : undefined),
          }}
          locations={locationSelectItem.stocksByLocation || []}
          onSelect={handleLocationSelect}
        />
      )}

    </div>
  );
}
