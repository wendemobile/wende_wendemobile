'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Users, Phone, Mail, ChevronRight, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(searchQuery && { query: searchQuery }),
      });
      const res = await fetch(`/api/customers?${params}`);
      return res.json();
    },
  });

  const customers = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;
  const totalCustomers = data?.data?.total || 0;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">{totalCustomers} customers</p>
        </div>
        <Link href="/customers/new">
          <Button className="gradient-primary glow-sm w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="mobile-card">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-11 bg-secondary border-border touch-target-min"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton h-20 rounded-xl" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card className="mobile-card">
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No customers found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Add your first customer'}
            </p>
            {!searchQuery && (
              <Link href="/customers/new">
                <Button className="mt-4 gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {customers.map((customer: any) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="mobile-card hover:border-primary/30 transition-all active:scale-[0.99]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground">{customer.name}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          {customer.phone && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CreditCard className="h-3 w-3" />
                          Credit Limit
                        </div>
                        <p className="font-bold text-primary">
                          {formatCurrency(parseFloat(customer.creditLimit || 0))}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
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
      <Link href="/customers/new" className="fab md:hidden bottom-20 safe-area-bottom">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
