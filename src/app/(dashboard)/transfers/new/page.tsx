'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, ScanLine, Plus, Minus, Trash2,
  MapPin, Package, Search, ArrowRight, User, Target,
  ShoppingCart, Store, RotateCcw, CheckCircle2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/ui/barcode-scanner-lazy';
import { generateUUID } from '@/lib/utils';
import { useScanDetector } from '@/hooks/use-scan-detector';

interface TransferItem {
  id: string;
  itemId: string;
  name: string;
  sku: string;
  qty: number;
  availableQty: number;
}

const TRANSFER_PURPOSES = [
  { value: 'STOCK_MOVE', label: 'Move', icon: ArrowRight },
  { value: 'FOR_SALE', label: 'Sale', icon: ShoppingCart },
  { value: 'SHOWROOM', label: 'Display', icon: Store },
  { value: 'RETURN_TO_WAREHOUSE', label: 'Return', icon: RotateCcw },
];

export default function NewTransferPage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [purpose, setPurpose] = useState('STOCK_MOVE');
  const [assignedToId, setAssignedToId] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [notes, setNotes] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Physical scanner detection - triggers search
  const { isScanning: isPhysicalScanning } = useScanDetector({
    onScan: (barcode) => {
      if (fromLocationId) {
        setSearchQuery(barcode);
        setScanFeedback({ type: 'success', message: `Scanned: ${barcode}` });
        setTimeout(() => setScanFeedback(null), 2000);
      } else {
        setScanFeedback({ type: 'error', message: 'Select source location first' });
        setTimeout(() => setScanFeedback(null), 3000);
      }
    },
    enabled: true,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const { data: searchResults } = useQuery({
    queryKey: ['items-search', searchQuery, fromLocationId],
    queryFn: async () => {
      if (!searchQuery || !fromLocationId) return [];
      // Don't filter by locationId - we want to see all items and their stock status
      const res = await fetch(`/api/items?query=${encodeURIComponent(searchQuery)}&pageSize=10`);
      const data = await res.json();
      return data.data?.items || [];
    },
    enabled: searchQuery.length > 0 && !!fromLocationId,
  });

  const createTransfer = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create transfer');
      return res.json();
    },
    onSuccess: () => {
      router.push('/transfers');
    },
  });

  const handleScan = useCallback((result: string) => {
    setSearchQuery(result);
  }, []);

  const addItem = (item: any) => {
    // Use stocksByLocation from the API response (preferred) or fall back to stocks
    const stocksByLocation = item.stocksByLocation || [];
    const stocks = item.stocks || [];

    // Try to find stock at the source location using stocksByLocation first
    let availableQty = 0;
    const stockByLoc = stocksByLocation.find((s: any) => s.locationId === fromLocationId);
    if (stockByLoc) {
      availableQty = stockByLoc.availableQuantity || 0;
    } else {
      // Fall back to stocks array if stocksByLocation doesn't have it
      const stock = stocks.find((s: any) =>
        s.locationId === fromLocationId || s.location?.id === fromLocationId
      );
      if (stock) {
        availableQty = parseFloat(stock.qty || 0) - parseFloat(stock.reservedQty || 0);
      }
    }

    if (availableQty <= 0) return;

    setItems(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) {
        return prev.map(i =>
          i.itemId === item.id
            ? { ...i, qty: Math.min(i.qty + 1, i.availableQty) }
            : i
        );
      }
      return [...prev, {
        id: generateUUID(),
        itemId: item.id,
        name: item.name,
        sku: item.sku,
        qty: 1,
        availableQty,
      }];
    });
    setSearchQuery('');
  };

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, Math.min(i.qty + delta, i.availableQty));
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocationId || !toLocationId || items.length === 0) return;

    createTransfer.mutate({
      fromLocationId,
      toLocationId,
      purpose,
      assignedToId: assignedToId || undefined,
      notes,
      items: items.map(i => ({ itemId: i.itemId, qty: i.qty })),
    });
  };

  // Filter users based on purpose
  // Note: API returns role as a string (role name), not an object
  const filteredUsers = users.filter((u: any) => {
    if (!u.isActive) return false; // Only show active users
    if (purpose === 'FOR_SALE') {
      const roleName = typeof u.role === 'string' ? u.role : u.role?.name || '';
      return roleName.toLowerCase().includes('cashier') || roleName.toLowerCase().includes('salesman');
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Scan Feedback Toast */}
      {scanFeedback && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${scanFeedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {scanFeedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-medium">{scanFeedback.message}</span>
        </div>
      )}

      {/* Physical Scanner Indicator */}
      {isPhysicalScanning && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium animate-pulse">
          Scanning...
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/transfers">
          <Button variant="ghost" size="icon" className="touch-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">New Transfer</h1>
          <p className="text-sm text-muted-foreground">Transfer stock between locations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Purpose Selection */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Transfer Purpose
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {TRANSFER_PURPOSES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPurpose(p.value)}
                  className={`p-2 sm:p-3 rounded-xl flex flex-col items-center gap-1 transition-all text-center ${purpose === p.value
                    ? 'bg-primary/20 border-2 border-primary text-primary'
                    : 'bg-secondary border-2 border-transparent hover:border-border'
                    }`}
                >
                  <p.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <p className="text-xs font-medium">{p.label}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col xs:flex-row xs:items-center gap-3">
              <div className="flex-1 space-y-2 min-w-0">
                <Label>From</Label>
                <select
                  className="w-full h-12 rounded-xl border border-border bg-secondary px-3 text-sm"
                  value={fromLocationId}
                  onChange={(e) => {
                    setFromLocationId(e.target.value);
                    setItems([]);
                  }}
                  required
                >
                  <option value="">Select source</option>
                  {locations.filter((l: any) => l.id !== toLocationId).map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <ArrowRight className="hidden xs:block h-5 w-5 text-primary mt-6 shrink-0" />

              <div className="flex-1 space-y-2 min-w-0">
                <Label>To</Label>
                <select
                  className="w-full h-12 rounded-xl border border-border bg-secondary px-3 text-sm"
                  value={toLocationId}
                  onChange={(e) => setToLocationId(e.target.value)}
                  required
                >
                  <option value="">Select destination</option>
                  {locations.filter((l: any) => l.id !== fromLocationId).map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assign To User */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Assign To (Receiver)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
            >
              <option value="">Select user to receive</option>
              {filteredUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({typeof u.role === 'string' ? u.role : u.role?.name || 'No role'})
                </option>
              ))}
            </select>
            {purpose === 'FOR_SALE' && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 When receiver accepts, they'll be redirected to POS to sell these items
              </p>
            )}
            {purpose === 'SHOWROOM' && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 Items will be added to showroom inventory when received
              </p>
            )}
          </CardContent>
        </Card>

        {/* Add Items */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Items to Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={fromLocationId ? "Search items..." : "Select source location first"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-secondary border-border"
                  disabled={!fromLocationId}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowScanner(true)}
                disabled={!fromLocationId}
                className="touch-btn border-primary text-primary"
              >
                <ScanLine className="h-5 w-5" />
              </Button>
            </div>

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden">
                {searchResults.map((item: any) => {
                  // Use stocksByLocation from the API response (preferred) or fall back to stocks
                  const stocksByLocation = item.stocksByLocation || [];
                  const stocks = item.stocks || [];

                  // Calculate available quantity at source location
                  let availableQty = 0;
                  const stockByLoc = stocksByLocation.find((s: any) => s.locationId === fromLocationId);
                  if (stockByLoc) {
                    availableQty = stockByLoc.availableQuantity || 0;
                  } else {
                    // Fall back to stocks array
                    const stock = stocks.find((s: any) =>
                      s.locationId === fromLocationId || s.location?.id === fromLocationId
                    );
                    if (stock) {
                      availableQty = parseFloat(stock.qty || 0) - parseFloat(stock.reservedQty || 0);
                    }
                  }

                  // Calculate total stock across all locations
                  const totalStock = stocksByLocation.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0)
                    || stocks.reduce((sum: number, s: any) => sum + parseFloat(s.qty || 0), 0)
                    || item.totalStock || 0;

                  const fromLocation = locations.find((l: any) => l.id === fromLocationId);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      disabled={availableQty <= 0}
                      className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors border-b border-border last:border-b-0 disabled:opacity-50"
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                        {availableQty <= 0 && totalStock > 0 && (
                          <p className="text-xs text-amber-500 mt-1">
                            ⚠️ {totalStock} in other locations, 0 in {fromLocation?.name || 'source'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`badge ${availableQty > 0 ? 'badge-success' : 'badge-error'}`}>
                          {availableQty} available
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Items */}
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="p-3 bg-secondary rounded-xl">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Available: {item.availableQty}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive flex-shrink-0"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQty(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center font-medium text-sm">{item.qty}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQty(item.id, 1)}
                          disabled={item.qty >= item.availableQty}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="badge badge-info">{item.qty} to transfer</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items added yet</p>
                <p className="text-sm">Search or scan items to add</p>
                {fromLocationId && <p className="text-xs mt-1">Physical scanner ready - just scan!</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full h-20 rounded-xl border border-border bg-secondary px-4 py-3 text-sm resize-none"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/transfers" className="flex-1">
            <Button type="button" variant="outline" className="w-full touch-btn">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1 gradient-primary glow-sm touch-btn"
            disabled={createTransfer.isPending || items.length === 0 || !fromLocationId || !toLocationId}
          >
            {createTransfer.isPending ? 'Creating...' : 'Create Transfer'}
          </Button>
        </div>
      </form>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div >
  );
}
