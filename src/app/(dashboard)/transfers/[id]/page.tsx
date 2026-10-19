'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { 
  ArrowLeft, ArrowRight, MapPin, Package, Truck, Check, X, 
  User, Target, ShoppingCart, Store, Warehouse, RotateCcw 
} from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { toast } from 'react-hot-toast';

const PURPOSE_INFO: Record<string, { label: string; icon: any; color: string }> = {
  STOCK_MOVE: { label: 'Stock Move', icon: ArrowRight, color: 'text-blue-500' },
  FOR_SALE: { label: 'For Sale', icon: ShoppingCart, color: 'text-emerald-500' },
  SHOWROOM: { label: 'Showroom', icon: Store, color: 'text-purple-500' },
  RETURN_TO_WAREHOUSE: { label: 'Return', icon: RotateCcw, color: 'text-amber-500' },
};

export default function TransferDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToCart, clearCart } = useCart();

  const { data: transfer, isLoading } = useQuery({
    queryKey: ['transfer', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/transfers/${params.id}`);
      const data = await res.json();
      return data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      if (status === 'RECEIVED' && transfer?.purpose === 'FOR_SALE') {
        const res = await fetch(`/api/transfers/${params.id}/receive-for-sale`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to receive transfer for sale');
        return { isForSale: true, ...data };
      }

      const res = await fetch(`/api/transfers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update transfer');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transfer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });

      if (data.isForSale && data.data?.cartItems) {
        clearCart();
        for (const item of data.data.cartItems) {
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
        router.push('/pos?showCart=true');
        return;
      }

      if (data.data?.redirectTo) {
        router.push(data.data.redirectTo);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update transfer');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!transfer) {
    return <div className="text-center py-12 text-muted-foreground">Transfer not found</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED': return 'badge-info';
      case 'SENT': return 'badge-warning';
      case 'RECEIVED': return 'badge-success';
      case 'CANCELLED': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const purposeInfo = PURPOSE_INFO[transfer.purpose] || PURPOSE_INFO.STOCK_MOVE;
  const PurposeIcon = purposeInfo.icon;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/transfers">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{transfer.transferNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(transfer.createdAt)}</p>
        </div>
        <span className={`badge ${getStatusBadge(transfer.status)}`}>{transfer.status}</span>
      </div>

      {/* Purpose Badge */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl bg-secondary flex items-center justify-center`}>
              <PurposeIcon className={`h-6 w-6 ${purposeInfo.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Purpose</p>
              <p className={`font-medium ${purposeInfo.color}`}>{purposeInfo.label}</p>
            </div>
            {transfer.purpose === 'FOR_SALE' && transfer.status === 'SENT' && (
              <div className="text-right">
                <p className="text-xs text-emerald-400">📱 Ready for POS</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium text-foreground">{transfer.fromLocation?.name}</p>
              </div>
            </div>
            <ArrowRight className="h-6 w-6 text-primary" />
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground text-right">To</p>
                <p className="font-medium text-foreground">{transfer.toLocation?.name}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned User */}
      {(transfer.assignedTo || transfer.receivedBy) && (
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                {transfer.assignedTo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="font-medium text-foreground">{transfer.assignedTo.fullName}</p>
                  </div>
                )}
                {transfer.receivedBy && (
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground">Received By</p>
                    <p className="font-medium text-emerald-400">{transfer.receivedBy.fullName}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Items ({transfer.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {transfer.items && transfer.items.length > 0 ? (
            <div className="space-y-2">
              {transfer.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">{item.item?.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.item?.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{parseFloat(item.qty)}</p>
                    <p className="text-xs text-muted-foreground">units</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No items</p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {transfer.notes && (
        <Card className="bg-card border-border/50">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">{transfer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {transfer.status !== 'RECEIVED' && transfer.status !== 'CANCELLED' && (
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              {transfer.status === 'CREATED' && (
                <>
                  <Button
                    onClick={() => updateStatus.mutate('SENT')}
                    disabled={updateStatus.isPending}
                    className="flex-1 gradient-primary"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Send Transfer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus.mutate('CANCELLED')}
                    disabled={updateStatus.isPending}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              {transfer.status === 'SENT' && (
                <Button
                  onClick={() => updateStatus.mutate('RECEIVED')}
                  disabled={updateStatus.isPending}
                  className="flex-1 gradient-primary"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {transfer.purpose === 'FOR_SALE' ? 'Receive & Go to POS' : 'Receive Items'}
                </Button>
              )}
            </div>
            {transfer.status === 'SENT' && transfer.purpose === 'FOR_SALE' && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                💡 After receiving, you'll be redirected to POS to sell these items
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Created</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(transfer.createdAt)} by {transfer.createdBy?.fullName}
                </p>
              </div>
            </div>
            {transfer.sentAt && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sent</p>
                  <p className="text-xs text-muted-foreground">{formatDate(transfer.sentAt)}</p>
                </div>
              </div>
            )}
            {transfer.receivedAt && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Received</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transfer.receivedAt)} by {transfer.receivedBy?.fullName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
