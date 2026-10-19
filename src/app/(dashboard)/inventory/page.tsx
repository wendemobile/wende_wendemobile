'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/permissions';
import { formatCurrency } from '@/lib/utils';
import {
  Search, Plus, Package, Eye, Edit, Trash2,
  ScanLine, Grid3X3, List,
  Image as ImageIcon, ShoppingCart, Filter, MapPin, AlertTriangle, X,
} from 'lucide-react';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/ui/barcode-scanner-lazy';
import { LocationSelectDialog } from '@/components/inventory/location-select-dialog';
import { CartIndicator } from '@/components/inventory/cart-indicator';
import { useCart } from '@/contexts/cart-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type StockStatus = 'all' | 'low' | 'out' | 'normal';

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showScanner, setShowScanner] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [locationSelectItem, setLocationSelectItem] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canWrite = hasPermission(session?.user?.role || 'CASHIER', 'items:write');
  const { addToCart } = useCart();

  // Fetch locations for filter
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      const data = await res.json();
      return data.data || [];
    },
  });

  const handleAddToCart = useCallback((item: any) => {
    const stocksWithQty = item.stocksByLocation?.filter((s: any) => s.availableQuantity > 0) || [];

    if (stocksWithQty.length === 0) {
      return; // No stock available
    }

    if (stocksWithQty.length === 1) {
      // Single location - add directly
      const stock = stocksWithQty[0];
      addToCart({
        itemId: item.id,
        name: item.name,
        sku: item.sku,
        unitPrice: parseFloat(item.unitPrice),
        costPrice: parseFloat(item.costPrice),
        locationId: stock.locationId,
        locationName: stock.locationName,
        imageUrl: item.image?.path ? `/api/items/${item.id}/image` : undefined,
      });
    } else {
      // Multiple locations - show dialog
      setLocationSelectItem(item);
    }
  }, [addToCart]);

  const handleLocationSelect = useCallback((locationId: string, locationName: string) => {
    if (locationSelectItem) {
      addToCart({
        itemId: locationSelectItem.id,
        name: locationSelectItem.name,
        sku: locationSelectItem.sku,
        unitPrice: parseFloat(locationSelectItem.unitPrice),
        costPrice: parseFloat(locationSelectItem.costPrice),
        locationId,
        locationName,
        imageUrl: locationSelectItem.image?.path ? `/api/items/${locationSelectItem.id}/image` : undefined,
      });
      setLocationSelectItem(null);
    }
  }, [locationSelectItem, addToCart]);

  // Load all items on single page (no pagination)
  const pageSize = 10000000; // Very large to get all items

  // Debounce search query for API
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch ALL items (no pagination - single page view)
  const { data, isLoading } = useQuery({
    queryKey: ['items', selectedLocation, stockStatus, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        pageSize: pageSize.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedLocation && { locationId: selectedLocation }),
        ...(stockStatus !== 'all' && { stockStatus }),
      });
      const res = await fetch(`/api/items?${params}`);
      return res.json();
    },
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new
    staleTime: 30000, // Cache for 30 seconds to prevent unnecessary refetches
  });

  const items = data?.data?.items || [];
  const totalCount = data?.data?.total || 0;

  // Stock summary calculation - this now only reflects CURRENT PAGE items if used directly
  // NOTE: For accurate global summary, we should ideally fetch stats from a separate API endpoint.
  // However, for performance, we might just show summary for visible items or remove it if it's misleading.
  // The current implementation calculated it from ALL items in the client.
  // To keep "very fast performance", we shouldn't fetch all items just for this summary.
  // Let's rely on the displayed items for the summary or hide it if it's confusing.
  // For now, I will calculate it based on the *fetched* (visible) items, but note this limitation.
  // Or better, I can fetch a stats endpoint.
  // I'll calculate from `items` (current page) for now to avoid extra calls, as "fast performance" is key.

  const stockSummary = useMemo(() => {
    const summary = {
      totalPieces: 0,
      totalMeters: 0,
      totalKg: 0,
      totalLiters: 0,
      totalBoxes: 0,
    };
    items.forEach((item: any) => {
      const stock = item.totalStock || 0;
      const unit = item.unitOfMeasure || 'PIECE';
      switch (unit) {
        case 'PIECE': summary.totalPieces += stock; break;
        case 'METER': summary.totalMeters += stock; break;
        case 'KG': summary.totalKg += stock; break;
        case 'LITER': summary.totalLiters += stock; break;
        case 'BOX': summary.totalBoxes += stock; break;
        default: summary.totalPieces += stock;
      }
    });
    return summary;
  }, [items]);

  const hasActiveFilters = selectedLocation || stockStatus !== 'all';

  const clearFilters = () => {
    setSelectedLocation('');
    setStockStatus('all');
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setDeleteId(null);
      setDeleteItemName('');
      setDeleteConfirmText('');
    },
  });

  // Helper to open delete dialog with item info
  const openDeleteDialog = useCallback((id: string, name: string) => {
    setDeleteId(id);
    setDeleteItemName(name);
    setDeleteConfirmText('');
  }, []);

  // Helper to close delete dialog
  const closeDeleteDialog = useCallback(() => {
    setDeleteId(null);
    setDeleteItemName('');
    setDeleteConfirmText('');
  }, []);

  const handleScan = useCallback((result: string) => {
    setSearchQuery(result);
  }, []);

  const totalItems = items.length;

  return (
    <div className="space-y-3 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-responsive-2xl font-bold text-foreground truncate">Inventory</h1>
          <p className="text-muted-foreground text-responsive-xs">{totalItems} products</p>
        </div>
        {canWrite && (
          <Link href="/inventory/new" className="hidden sm:block">
            <Button className="gradient-primary glow-sm">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add Item</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Stock Summary */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {stockSummary.totalPieces > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-primary/10 rounded-lg">
            <span className="text-xs font-medium text-primary">{stockSummary.totalPieces.toLocaleString()} pcs</span>
          </div>
        )}
        {stockSummary.totalMeters > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-blue-500/10 rounded-lg">
            <span className="text-xs font-medium text-blue-500">{stockSummary.totalMeters.toLocaleString()} m</span>
          </div>
        )}
        {stockSummary.totalKg > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-amber-500/10 rounded-lg">
            <span className="text-xs font-medium text-amber-500">{stockSummary.totalKg.toLocaleString()} kg</span>
          </div>
        )}
        {stockSummary.totalLiters > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-cyan-500/10 rounded-lg">
            <span className="text-xs font-medium text-cyan-500">{stockSummary.totalLiters.toLocaleString()} L</span>
          </div>
        )}
        {stockSummary.totalBoxes > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-purple-500/10 rounded-lg">
            <span className="text-xs font-medium text-purple-500">{stockSummary.totalBoxes.toLocaleString()} boxes</span>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <Card className="mobile-card">
        <CardContent className="p-2 sm:p-3 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-11 text-sm bg-secondary border-border touch-target-min"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowScanner(true)}
              className="h-11 w-11 flex-shrink-0 border-primary text-primary touch-target-min"
            >
              <ScanLine className="h-4 w-4" />
            </Button>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 w-11 flex-shrink-0 touch-target-min relative ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
              )}
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-11 w-11 flex-shrink-0 flex touch-target-min"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="h-11 w-11 flex-shrink-0 flex touch-target-min"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="space-y-2 pt-2 border-t border-border">
              {/* Location Filter */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="flex-1 h-10 bg-secondary">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stock Status Filter */}
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { value: 'all', label: 'All', color: 'bg-secondary' },
                    { value: 'normal', label: 'In Stock', color: 'bg-emerald-500/20 text-emerald-500' },
                    { value: 'low', label: 'Low Stock', color: 'bg-amber-500/20 text-amber-500' },
                    { value: 'out', label: 'Out of Stock', color: 'bg-red-500/20 text-red-500' },
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setStockStatus(status.value as StockStatus)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${stockStatus === status.value
                        ? status.value === 'all' ? 'bg-primary text-primary-foreground' : status.color + ' ring-2 ring-offset-1 ring-current'
                        : 'bg-secondary hover:bg-secondary/80'
                        }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full h-9 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Display */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton aspect-square w-full rounded-xl mb-2" />
              <div className="skeleton h-3 w-3/4 mb-1" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="mobile-card">
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-responsive-base font-medium text-foreground">No items found</p>
            <p className="text-muted-foreground text-responsive-xs mt-1">
              {searchQuery ? 'Try different search' : 'Add your first item'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {items.map((item: any) => (
            <ItemCard key={item.id} item={item} onDelete={() => openDeleteDialog(item.id, item.name)} canWrite={canWrite} onAddToCart={() => handleAddToCart(item)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <ItemRow key={item.id} item={item} onDelete={() => openDeleteDialog(item.id, item.name)} canWrite={canWrite} onAddToCart={() => handleAddToCart(item)} />
          ))}
        </div>
      )}



      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive text-responsive-lg flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Item?
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 sm:p-5 space-y-4">
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="font-medium text-foreground text-sm">{deleteItemName}</p>
              <p className="text-destructive text-xs mt-1">This action cannot be undone.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Type <span className="font-bold text-destructive">DELETE</span> to confirm:
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="h-11 text-center font-mono uppercase"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11 touch-target-min" onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-11 touch-target-min"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending || deleteConfirmText.toUpperCase() !== 'DELETE'}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAB for mobile */}
      {canWrite && (
        <Link href="/inventory/new" className="fab md:hidden bottom-20 safe-area-bottom">
          <Plus className="h-6 w-6" />
        </Link>
      )}

      {/* Cart Indicator */}
      <CartIndicator />

      {/* Location Select Dialog */}
      {locationSelectItem && (
        <LocationSelectDialog
          isOpen={!!locationSelectItem}
          onClose={() => setLocationSelectItem(null)}
          item={{
            id: locationSelectItem.id,
            name: locationSelectItem.name,
            sku: locationSelectItem.sku,
            unitPrice: parseFloat(locationSelectItem.unitPrice),
            costPrice: parseFloat(locationSelectItem.costPrice),
            imageUrl: locationSelectItem.image?.path ? `/api/items/${locationSelectItem.id}/image` : undefined,
          }}
          locations={locationSelectItem.stocksByLocation || []}
          onSelect={handleLocationSelect}
        />
      )}
    </div>
  );
}

// Helper function to get unit label
function getUnitLabel(unitOfMeasure: string): string {
  switch (unitOfMeasure) {
    case 'PIECE': return 'pcs';
    case 'METER': return 'm';
    case 'KG': return 'kg';
    case 'LITER': return 'L';
    case 'BOX': return 'box';
    case 'SET': return 'set';
    case 'PAIR': return 'pair';
    case 'ROLL': return 'roll';
    default: return 'pcs';
  }
}

// Helper function to get stock status color
function getStockStatusColor(totalStock: number, minStock: number): string {
  if (totalStock <= 0) return 'bg-red-500/20 text-red-500';
  if (totalStock <= minStock) return 'bg-amber-500/20 text-amber-500';
  return 'bg-emerald-500/20 text-emerald-500';
}

function ItemCard({ item, onDelete, canWrite, onAddToCart }: { item: any; onDelete: () => void; canWrite: boolean; onAddToCart: () => void }) {
  const totalStock = item.totalStock || 0;
  const minStock = item.minStock || 0;
  const unitLabel = getUnitLabel(item.unitOfMeasure || 'PIECE');
  const stockColor = getStockStatusColor(totalStock, minStock);
  const stockBgColor = totalStock <= 0 ? 'bg-red-500' : totalStock <= minStock ? 'bg-amber-500' : 'bg-emerald-500';
  const imageUrl = item.image?.path || (item.image ? `/api/items/${item.id}/image` : null);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="mobile-card group hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden">
      {/* Image Container - Clean without overlay */}
      <div className="aspect-square bg-secondary overflow-hidden relative">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
            <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Quick Add Button - Floating on image */}
        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
          disabled={totalStock <= 0}
          className={`absolute top-2 right-2 h-9 w-9 rounded-full shadow-lg flex items-center justify-center transition-all ${totalStock <= 0
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:scale-110 active:scale-95'
            }`}
          title={totalStock <= 0 ? 'Out of stock' : 'Add to cart'}
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-2.5 sm:p-3 space-y-2">
        {/* Stock Badge - Below image, prominent and always visible */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${stockBgColor} text-white`}>
          <Package className="h-3.5 w-3.5" />
          <span className="text-sm font-bold">{totalStock}</span>
          <span className="text-xs font-medium">{unitLabel}</span>
        </div>

        {/* Item Name */}
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {item.name}
        </h3>

        {/* Price */}
        <p className="text-lg font-bold text-primary">{formatCurrency(parseFloat(item.unitPrice))}</p>

        {/* SKU */}
        <p className="text-xs text-muted-foreground font-mono truncate">{item.sku}</p>

        {/* Action Buttons - Always visible, well-spaced */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border">
          <Link href={`/inventory/${item.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full h-9 text-xs font-medium">
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Button>
          </Link>
          {canWrite && (
            <>
              <Link href={`/inventory/${item.id}/edit`}>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, onDelete, canWrite, onAddToCart }: { item: any; onDelete: () => void; canWrite: boolean; onAddToCart: () => void }) {
  const totalStock = item.totalStock || 0;
  const minStock = item.minStock || 0;
  const unitLabel = getUnitLabel(item.unitOfMeasure || 'PIECE');
  const stockBgColor = totalStock <= 0 ? 'bg-red-500' : totalStock <= minStock ? 'bg-amber-500' : 'bg-emerald-500';
  const imageUrl = item.image?.path || (item.image ? `/api/items/${item.id}/image` : null);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="mobile-card p-3 sm:p-4">
      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-secondary flex-shrink-0 overflow-hidden">
          {imageUrl && !imgError ? (
            <div className="relative w-full h-full">
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
              <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight line-clamp-2">{item.name}</h3>
          <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-bold text-primary">{formatCurrency(parseFloat(item.unitPrice))}</p>
            {/* Stock Badge - Prominent pill */}
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${stockBgColor} text-white text-sm`}>
              <span className="font-bold">{totalStock}</span>
              <span className="text-xs">{unitLabel}</span>
            </div>
          </div>
        </div>

        {/* Quick Add Button - Always visible on right */}
        <button
          onClick={onAddToCart}
          disabled={totalStock <= 0}
          className={`h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${totalStock <= 0
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md'
            }`}
          title={totalStock <= 0 ? 'Out of stock' : 'Add to cart'}
        >
          <ShoppingCart className="h-5 w-5" />
        </button>
      </div>

      {/* Action Buttons Row - Below content, always visible */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <Link href={`/inventory/${item.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full h-10 text-sm font-medium">
            <Eye className="h-4 w-4 mr-1.5" />
            View Details
          </Button>
        </Link>
        {canWrite && (
          <>
            <Link href={`/inventory/${item.id}/edit`}>
              <Button variant="outline" size="sm" className="h-10 px-3">
                <Edit className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
