'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { Building2, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchQuery && { query: searchQuery }),
      });
      const res = await fetch(`/api/vendors?${params}`);
      return res.json();
    },
  });

  const vendors = data?.data || [];

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage suppliers and vendor payments</p>
        </div>
        <Link href="/vendors/new">
          <Button className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </Link>
      </div>

      <Card className="mobile-card">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-secondary border-border touch-target-min"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vendors found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {vendors.map((vendor: any) => (
                  <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                    <div className="p-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">{vendor.contactPerson || 'No contact'}</p>
                          <p className="text-xs text-muted-foreground">{vendor.phone || 'No phone'}</p>
                        </div>
                        <p className="font-bold text-primary whitespace-nowrap">
                          {formatCurrency(parseFloat(vendor.balance || 0))}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Balance</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor: any) => (
                      <tr key={vendor.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{vendor.name}</td>
                        <td className="py-3 px-4 text-foreground">{vendor.contactPerson || '-'}</td>
                        <td className="py-3 px-4 text-foreground">{vendor.phone || '-'}</td>
                        <td className="py-3 px-4 text-right font-bold text-primary">
                          {formatCurrency(parseFloat(vendor.balance || 0))}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/vendors/${vendor.id}`}>
                            <Button variant="ghost" size="sm" className="h-11 touch-target-min">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* FAB for mobile */}
      <Link href="/vendors/new" className="fab md:hidden bottom-20 safe-area-bottom">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
