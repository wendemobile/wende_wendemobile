'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Calendar, User, DollarSign, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';

export default function NewCreditPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    principal: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
    notes: '',
  });

  // Search customers
  const { data: customers } = useQuery({
    queryKey: ['customers-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const res = await fetch(`/api/customers?query=${encodeURIComponent(searchQuery)}&pageSize=10`);
      const data = await res.json();
      return data.data?.items || [];
    },
    enabled: searchQuery.length > 1,
  });

  const createCredit = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to create credit');
      }
      return result;
    },
    onSuccess: () => {
      router.push('/credits');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const selectCustomer = (customer: any) => {
    setFormData({
      ...formData,
      customerId: customer.id,
      customerName: customer.name,
    });
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.customerId) {
      setError('Please select a customer');
      return;
    }

    createCredit.mutate({
      customerId: formData.customerId,
      principal: parseFloat(formData.principal),
      dueDate: formData.dueDate,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/credits">
          <Button variant="ghost" size="icon" className="touch-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add Credit</h1>
          <p className="text-sm text-muted-foreground">Record a manual credit</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Selection */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.customerId ? (
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/30 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{formData.customerName}</p>
                  <p className="text-xs text-muted-foreground">Selected customer</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, customerId: '', customerName: '' })}
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-secondary border-border"
                  />
                </div>
                {customers && customers.length > 0 && (
                  <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {customers.map((customer: any) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                        className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors border-b border-border last:border-b-0 text-left"
                      >
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Credit Details */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Credit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="principal"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.principal}
                  onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                  className="pl-10 h-11 bg-secondary border-border"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="pl-10 h-11 bg-secondary border-border"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full h-20 rounded-xl border border-border bg-secondary px-4 py-3 text-sm resize-none"
                placeholder="Additional notes about this credit..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mobile-card border-destructive bg-destructive/10">
            <CardContent className="p-3">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/credits" className="flex-1">
            <Button type="button" variant="outline" className="w-full touch-btn">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1 gradient-primary glow-sm touch-btn"
            disabled={createCredit.isPending || !formData.customerId}
          >
            {createCredit.isPending ? 'Creating...' : 'Create Credit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
