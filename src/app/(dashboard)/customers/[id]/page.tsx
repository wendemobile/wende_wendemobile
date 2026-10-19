'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, User, CreditCard, ShoppingCart, Phone, Mail, MapPin, Hash, Edit } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
    address: '',
    creditLimit: '0',
  });

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${params.id}`);
      const data = await res.json();
      return data.data;
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update customer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowEditModal(false);
      toast.success('Customer updated');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const openEdit = () => {
    if (!customer) return;
    setEditData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      idNumber: customer.idNumber || '',
      address: customer.address || '',
      creditLimit: String(customer.creditLimit || 0),
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomer.mutate({
      name: editData.name,
      phone: editData.phone || undefined,
      email: editData.email || undefined,
      idNumber: editData.idNumber || undefined,
      address: editData.address || undefined,
      creditLimit: parseFloat(editData.creditLimit) || 0,
    });
  };

  const { data: credits } = useQuery({
    queryKey: ['customer-credits', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/credits?customerId=${params.id}`);
      const data = await res.json();
      return data.data?.items || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  const totalOutstanding = credits?.reduce(
    (sum: number, c: any) => sum + parseFloat(c.balance),
    0
  ) || 0;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/customers">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.phone || 'No phone'}</p>
        </div>
        <Button size="sm" onClick={openEdit} className="gradient-primary">
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 text-primary" />
              Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm px-3 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Phone
              </span>
              <span className="text-foreground">{customer.phone || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Email
              </span>
              <span className="text-foreground truncate max-w-[120px]">{customer.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Hash className="h-3 w-3" /> ID
              </span>
              <span className="text-foreground">{customer.idNumber || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Address
              </span>
              <span className="text-foreground text-right max-w-[120px] truncate">{customer.address || '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              Credit Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limit</span>
              <span className="font-medium text-foreground">{formatCurrency(parseFloat(customer.creditLimit || 0))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Outstanding</span>
              <span className={`font-medium ${totalOutstanding > 0 ? 'text-red-400' : 'text-foreground'}`}>
                {formatCurrency(totalOutstanding)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium text-emerald-400">
                {formatCurrency(Math.max(0, parseFloat(customer.creditLimit || 0) - totalOutstanding))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Open Credits</span>
              <span className="text-foreground">{credits?.filter((c: any) => c.status === 'OPEN').length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overdue</span>
              <span className="text-red-400">{credits?.filter((c: any) => c.status === 'OVERDUE').length || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit History */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-3 pt-3 pb-2">
          <CardTitle className="text-base">Credit History</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {credits && credits.length > 0 ? (
            <div className="space-y-2">
              {/* Mobile Cards */}
              <div className="md:hidden space-y-2">
                {credits.map((credit: any) => (
                  <div key={credit.id} className="bg-secondary/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Due: {formatDate(credit.dueDate)}</span>
                      <span className={`badge ${
                        credit.status === 'CLOSED' ? 'badge-success' :
                        credit.status === 'OVERDUE' ? 'badge-error' :
                        'badge-info'
                      }`}>
                        {credit.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Principal</p>
                        <p className="font-medium text-foreground">{formatCurrency(parseFloat(credit.principal))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="font-bold text-primary">{formatCurrency(parseFloat(credit.balance))}</p>
                      </div>
                    </div>
                    <Link href={`/credits/${credit.id}`}>
                      <Button variant="ghost" size="sm" className="w-full mt-1">View Details</Button>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-sm text-muted-foreground font-medium">Due Date</th>
                      <th className="text-right py-2 text-sm text-muted-foreground font-medium">Principal</th>
                      <th className="text-right py-2 text-sm text-muted-foreground font-medium">Balance</th>
                      <th className="text-center py-2 text-sm text-muted-foreground font-medium">Status</th>
                      <th className="text-right py-2 text-sm text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credits.map((credit: any) => (
                      <tr key={credit.id} className="border-b border-border/50">
                        <td className="py-3 text-sm">{formatDate(credit.dueDate)}</td>
                        <td className="py-3 text-sm text-right">{formatCurrency(parseFloat(credit.principal))}</td>
                        <td className="py-3 text-sm text-right font-medium text-primary">{formatCurrency(parseFloat(credit.balance))}</td>
                        <td className="py-3 text-center">
                          <span className={`badge ${
                            credit.status === 'CLOSED' ? 'badge-success' :
                            credit.status === 'OVERDUE' ? 'badge-error' :
                            'badge-info'
                          }`}>
                            {credit.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/credits/${credit.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">No credit history</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              Edit Customer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input
                  value={editData.idNumber}
                  onChange={(e) => setEditData({ ...editData, idNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Credit Limit</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={editData.creditLimit}
                onChange={(e) => setEditData({ ...editData, creditLimit: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gradient-primary" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
