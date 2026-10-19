'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Plus, Package, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function LayawaysPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['layaways', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), pageSize: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/layaways?${params}`);
      return res.json();
    },
  });

  const layaways = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'badge-warning';
      case 'COMPLETED': return 'badge-success';
      case 'CANCELLED': return 'badge-error';
      case 'EXPIRED': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const filteredLayaways = layaways.filter((l: any) =>
    !searchQuery || 
    l.layawayNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Layaways</h1>
          <p className="text-sm text-muted-foreground">{data?.data?.total || 0} total layaways</p>
        </div>
        <Link href="/layaways/new">
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">New Layaway</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mobile-card">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-11 bg-secondary border-border touch-target-min"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-11 rounded-xl border border-border bg-secondary px-3 text-sm touch-target-min"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Layaways List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton h-20 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredLayaways.length === 0 ? (
        <Card className="mobile-card">
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-medium">No layaways found</p>
            <p className="text-muted-foreground text-sm mt-1">Create your first layaway</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLayaways.map((layaway: any) => {
            const progress = Number(layaway.totalAmount) > 0 
              ? (Number(layaway.paidAmount) / Number(layaway.totalAmount)) * 100 
              : 0;
            return (
              <Link key={layaway.id} href={`/layaways/${layaway.id}`}>
                <Card className="mobile-card hover:border-primary/30 transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{layaway.customer?.name}</p>
                          <p className="text-xs text-muted-foreground">{layaway.customer?.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadge(layaway.status)}`}>{layaway.status}</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">{layaway.layawayNumber}</p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-2 bg-secondary/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-medium text-foreground text-sm">{formatCurrency(Number(layaway.totalAmount))}</p>
                      </div>
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="font-medium text-emerald-400 text-sm">{formatCurrency(Number(layaway.paidAmount))}</p>
                      </div>
                      <div className="p-2 bg-amber-500/10 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="font-bold text-amber-400 text-sm">{formatCurrency(Number(layaway.balanceAmount))}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{progress.toFixed(0)}% paid</span>
                        {layaway.dueDate && (() => {
                          const dueDate = new Date(layaway.dueDate);
                          const today = new Date();
                          const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) {
                            return <span className="badge badge-error text-xs">{Math.abs(diffDays)} days overdue</span>;
                          } else if (diffDays <= 7) {
                            return <span className="badge badge-warning text-xs">{diffDays} days left</span>;
                          }
                          return <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(layaway.dueDate)}
                          </span>;
                        })()}
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">{page}/{totalPages}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-11 w-11 p-0 touch-target-min">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-11 w-11 p-0 touch-target-min">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* FAB */}
      <Link href="/layaways/new" className="fab md:hidden bottom-20 safe-area-bottom">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
