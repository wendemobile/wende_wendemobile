'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Save, Package, Edit, Trash2, Image as ImageIcon, Barcode, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/image-upload';

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStockAdjust, setShowStockAdjust] = useState(false);
  const [adjustLocationId, setAdjustLocationId] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/items/${params.id}`);
      const data = await res.json();
      return data.data;
    },
  });

  const [formData, setFormData] = useState<any>(null);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const updateItem = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/items/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', params.id] });
      setIsEditing(false);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/items/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      router.push('/inventory');
    },
  });

  const adjustStock = useMutation({
    mutationFn: async (data: { itemId: string; locationId: string; qty: number; reason: string }) => {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to adjust stock');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', params.id] });
      setShowStockAdjust(false);
      setAdjustLocationId('');
      setAdjustQty('');
      setAdjustReason('');
      setAdjustError(null);
    },
    onError: (err: Error) => {
      setAdjustError(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-48 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">Item not found</p>
        <Link href="/inventory">
          <Button className="mt-4">Back to Inventory</Button>
        </Link>
      </div>
    );
  }

  const startEditing = () => {
    setFormData({
      name: item.name,
      brand: item.brand || '',
      category: item.category || '',
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      minStock: item.minStock,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateItem.mutate({
      ...formData,
      unitPrice: parseFloat(formData.unitPrice),
      costPrice: parseFloat(formData.costPrice),
      minStock: parseFloat(formData.minStock),
    });
  };

  const totalStock = item.stocks?.reduce((sum: number, s: any) => sum + parseFloat(s.qty), 0) || 0;
  const imageUrl = item.image?.path ? `/api/items/${item.id}/image` : null;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="touch-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{item.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={startEditing} className="touch-btn">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowDeleteConfirm(true)}
              className="touch-btn text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Image & Quick Info */}
      <Card className="mobile-card">
        <CardContent className="p-4">
          <div className="flex flex-col xs:flex-row gap-4 items-center xs:items-start">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 space-y-2 text-center xs:text-left min-w-0 w-full">
              <div className="flex items-center justify-center xs:justify-start gap-2">
                <span className={`badge ${totalStock > 0 ? 'badge-success' : 'badge-error'}`}>
                  {totalStock} in stock
                </span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(parseFloat(item.unitPrice))}
              </p>
              <p className="text-sm text-muted-foreground">
                Cost: {formatCurrency(parseFloat(item.costPrice))}
              </p>
              <div className="flex items-center justify-center xs:justify-start gap-2 text-xs text-muted-foreground">
                <Barcode className="h-3 w-3 shrink-0" />
                <span className="font-mono truncate">{item.barcode}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card className="mobile-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Product Image</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            itemId={params.id}
            currentImageUrl={imageUrl}
            onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['item', params.id] })}
            onDeleteSuccess={() => queryClient.invalidateQueries({ queryKey: ['item', params.id] })}
          />
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="mobile-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Sell Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Stock</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 gradient-primary" 
                  onClick={handleSave} 
                  disabled={updateItem.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateItem.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-secondary rounded-xl">
                <span className="text-muted-foreground">Brand</span>
                <span className="font-medium">{item.brand || '-'}</span>
              </div>
              <div className="flex justify-between p-3 bg-secondary rounded-xl">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{item.category || '-'}</span>
              </div>
              <div className="flex justify-between p-3 bg-secondary rounded-xl">
                <span className="text-muted-foreground">Unit of Measure</span>
                <span className="font-medium">{item.unitOfMeasure}</span>
              </div>
              <div className="flex justify-between p-3 bg-secondary rounded-xl">
                <span className="text-muted-foreground">Min Stock Level</span>
                <span className="font-medium">{item.minStock}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock by Location */}
      <Card className="mobile-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Stock by Location
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStockAdjust(true)}
              className="h-8 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adjust Stock
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {item.stocks && item.stocks.length > 0 ? (
            <div className="space-y-2">
              {item.stocks.map((stock: any) => (
                <div key={stock.id} className="flex justify-between p-3 bg-secondary rounded-xl">
                  <span className="text-foreground">{stock.location?.name || 'Unknown'}</span>
                  <span className={`font-bold ${parseFloat(stock.qty) > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {parseFloat(stock.qty)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between p-3 border-t border-border mt-2 pt-4">
                <span className="font-bold text-foreground">Total Stock</span>
                <span className="font-bold text-primary">{totalStock}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No stock records</p>
              <p className="text-sm mt-1">Click "Adjust Stock" to add stock to a location</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <Card className="relative z-10 w-full max-w-sm mobile-card">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Item?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete "{item.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => deleteItem.mutate()}
                  disabled={deleteItem.isPending}
                >
                  {deleteItem.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowStockAdjust(false);
            setAdjustError(null);
          }} />
          <Card className="relative z-10 w-full max-w-sm mobile-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Adjust Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add or remove stock for "{item.name}"
              </p>
              
              <div className="space-y-2">
                <Label>Location *</Label>
                <select
                  className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                  value={adjustLocationId}
                  onChange={(e) => setAdjustLocationId(e.target.value)}
                  required
                >
                  <option value="">Select location</option>
                  {locations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Quantity *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={() => setAdjustQty(prev => String(Math.max(-999, Math.round(((parseFloat(prev) || 0) - 1) * 100) / 100)))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="bg-secondary border-border text-center"
                    placeholder="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={() => setAdjustQty(prev => String(Math.round(((parseFloat(prev) || 0) + 1) * 100) / 100))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use positive number to add stock, negative to remove
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason *</Label>
                <select
                  className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                >
                  <option value="">Select reason</option>
                  <option value="Initial Stock">Initial Stock</option>
                  <option value="Stock Received">Stock Received</option>
                  <option value="Inventory Count">Inventory Count</option>
                  <option value="Damaged/Lost">Damaged/Lost</option>
                  <option value="Return from Customer">Return from Customer</option>
                  <option value="Correction">Correction</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {adjustError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive">{adjustError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowStockAdjust(false);
                    setAdjustError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gradient-primary"
                  onClick={() => {
                    if (!adjustLocationId || !adjustQty || !adjustReason) return;
                    adjustStock.mutate({
                      itemId: params.id,
                      locationId: adjustLocationId,
                      qty: parseFloat(adjustQty),
                      reason: adjustReason,
                    });
                  }}
                  disabled={adjustStock.isPending || !adjustLocationId || !adjustQty || !adjustReason}
                >
                  {adjustStock.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
