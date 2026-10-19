'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DefectsPage() {
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['defects', status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(status && { status }),
      });
      const res = await fetch(`/api/defects?${params}`);
      return res.json();
    },
  });

  const defects = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      NEW: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      DIAGNOSED: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      WITH_VENDOR: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      READY_FOR_CUSTOMER: 'bg-green-500/20 text-green-400 border border-green-500/30',
      COMPLETED: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Defect Management</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Track defective items and repairs</p>
        </div>
        <Link href="/defects/new">
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Defect
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap overflow-x-auto pb-2 no-scrollbar touch-scroll">
        {['', 'NEW', 'DIAGNOSED', 'WITH_VENDOR', 'READY_FOR_CUSTOMER', 'COMPLETED'].map((s) => (
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
            {s ? s.replace(/_/g, ' ') : 'All'}
          </Button>
        ))}
      </div>

      {/* Defects List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton h-24 rounded-xl" />
            </div>
          ))}
        </div>
      ) : defects.length === 0 ? (
        <Card className="mobile-card">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No defects found</p>
            <p className="text-muted-foreground text-sm mt-1">Create your first defect record</p>
            <Link href="/defects/new">
              <Button className="mt-4 gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Defect
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {defects.map((defect: any) => (
              <Link key={defect.id} href={`/defects/${defect.id}`}>
                <Card className="mobile-card hover:border-primary/30 transition-all active:scale-[0.99]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-primary font-medium">{defect.defectNumber}</p>
                        <p className="font-medium text-foreground text-sm mt-1 truncate">{defect.itemName}</p>
                      </div>
                      {getStatusBadge(defect.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>{defect.customer?.name || 'No customer'}</span>
                      <span>{formatDate(defect.intakeDate)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="mobile-card hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Defect #</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Item</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Intake Date</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defects.map((defect: any) => (
                      <tr key={defect.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-primary">{defect.defectNumber}</td>
                        <td className="py-3 px-4 text-foreground">{defect.itemName}</td>
                        <td className="py-3 px-4 text-muted-foreground">{defect.customer?.name || '-'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(defect.intakeDate)}</td>
                        <td className="py-3 px-4 text-center">{getStatusBadge(defect.status)}</td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/defects/${defect.id}`}>
                            <Button variant="ghost" size="sm" className="h-11 touch-target-min">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

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
        </>
      )}

      {/* FAB for mobile */}
      <Link href="/defects/new" className="fab md:hidden bottom-20 safe-area-bottom">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
