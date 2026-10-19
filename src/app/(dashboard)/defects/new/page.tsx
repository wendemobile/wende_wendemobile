'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, AlertTriangle, Search } from 'lucide-react';
import Link from 'next/link';

export default function NewDefectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    itemName: '',
    serialNumber: '',
    description: '',
    priority: 'NORMAL',
    customerSearch: '',
    customerId: '',
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', formData.customerSearch],
    queryFn: async () => {
      if (!formData.customerSearch) return [];
      const res = await fetch(`/api/customers?query=${encodeURIComponent(formData.customerSearch)}`);
      const data = await res.json();
      return data.data?.items || [];
    },
    enabled: formData.customerSearch.length > 1,
  });

  const createDefect = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create defect');
      return res.json();
    },
    onSuccess: () => {
      router.push('/defects');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDefect.mutate({
      itemName: formData.itemName,
      serialNumber: formData.serialNumber || undefined,
      description: formData.description,
      priority: formData.priority,
      customerId: formData.customerId || undefined,
    });
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/defects">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">New Defect</h1>
          <p className="text-sm text-muted-foreground">Record a defective item</p>
        </div>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Defect Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Search */}
            <div className="space-y-2">
              <Label htmlFor="customerSearch">Customer (Optional)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerSearch"
                  placeholder="Search customer..."
                  value={formData.customerSearch}
                  onChange={(e) => setFormData({ ...formData, customerSearch: e.target.value, customerId: '' })}
                  className="pl-9"
                />
              </div>
              {customers && customers.length > 0 && !formData.customerId && (
                <div className="bg-secondary/50 rounded-xl border border-border/50 max-h-32 overflow-y-auto">
                  {customers.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full p-3 text-left hover:bg-secondary text-sm transition-colors first:rounded-t-xl last:rounded-b-xl"
                      onClick={() => setFormData({ ...formData, customerId: c.id, customerSearch: c.name })}
                    >
                      <span className="text-foreground">{c.name}</span>
                      {c.phone && <span className="text-muted-foreground ml-2">- {c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Item Name & Serial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the defect..."
                required
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={createDefect.isPending}
                className="flex-1 gradient-primary"
              >
                {createDefect.isPending ? 'Creating...' : 'Create Defect'}
              </Button>
              <Link href="/defects" className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
