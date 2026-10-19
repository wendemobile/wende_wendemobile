'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ArrowLeftRight, Plus, ChevronRight, MapPin, Package, ShoppingCart, Store, RotateCcw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const PURPOSE_ICONS: Record<string, any> = {
  STOCK_MOVE: ArrowRight,
  FOR_SALE: ShoppingCart,
  SHOWROOM: Store,
  RETURN_TO_WAREHOUSE: RotateCcw,
};

export default function TransfersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [status, setStatus] = useState<string>(initialStatus);
  const [page, setPage] = useState(1);

  // Update status when URL changes
  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    if (urlStatus !== status) {
      setStatus(urlStatus);
      setPage(1);
    }
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['transfers', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(status && { status }),
      });
      const res = await fetch(`/api/transfers?${params}`);
      return res.json();
    },
  });

  const transfers = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      CREATED: 'badge-info',
      SENT: 'badge-warning',
      RECEIVED: 'badge-success',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-error',
    };
    return (
      <span className={`badge ${styles[status] || 'badge-info'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Stock Transfers</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Transfer items between locations</p>
        </div>
        <Link href="/transfers/new">
          <Button className="gradient-primary glow-sm w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar touch-scroll">
        {['', 'CREATED', 'SENT', 'RECEIVED', 'CANCELLED'].map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className="flex-shrink-0 h-11 touch-target-min"
          >
            {s || 'All'}
          </Button>
        ))}
      </div>

      {/* Transfers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton h-20 rounded-xl" />
            </div>
          ))}
        </div>
      ) : transfers.length === 0 ? (
        <Card className="mobile-card">
          <CardContent className="py-12 text-center">
            <ArrowLeftRight className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No transfers found</p>
            <p className="text-muted-foreground text-sm mt-1">Create your first transfer</p>
            <Link href="/transfers/new">
              <Button className="mt-4 gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transfers.map((transfer: any) => (
            <Link key={transfer.id} href={`/transfers/${transfer.id}`}>
              <Card className="mobile-card hover:border-primary/30 transition-all active:scale-[0.99]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-primary">{transfer.transferNumber}</span>
                        {getStatusBadge(transfer.status)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{transfer.fromLocation?.name || '-'}</span>
                        </div>
                        <ArrowLeftRight className="h-3 w-3 text-primary" />
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{transfer.toLocation?.name || '-'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(transfer.createdAt)}</span>
                        {transfer.items && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {transfer.items.length} items
                          </span>
                        )}
                        {transfer.purpose && transfer.purpose !== 'STOCK_MOVE' && (
                          <span className="flex items-center gap-1 text-primary">
                            {(() => {
                              const Icon = PURPOSE_ICONS[transfer.purpose] || ArrowRight;
                              return <Icon className="h-3 w-3" />;
                            })()}
                            {transfer.purpose.replace(/_/g, ' ')}
                          </span>
                        )}
                        {transfer.assignedTo && (
                          <span className="text-emerald-400">→ {transfer.assignedTo.fullName}</span>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-11 touch-target-min"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-11 touch-target-min"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* FAB for mobile */}
      <Link href="/transfers/new" className="fab md:hidden bottom-20 safe-area-bottom">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
