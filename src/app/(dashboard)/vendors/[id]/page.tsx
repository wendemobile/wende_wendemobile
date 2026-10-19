'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Package, DollarSign, Edit, Plus, X, History } from 'lucide-react';
import Link from 'next/link';

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const [showPayment, setShowPayment] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'CASH', bankAccountId: '', reference: '', notes: '' });
  const queryClient = useQueryClient();

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      return data.data || [];
    },
  });

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${params.id}`);
      const data = await res.json();
      return data.data;
    },
  });

  const updateVendor = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/vendors/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update vendor');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', params.id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setShowEdit(false);
    },
  });

  const openEditModal = () => {
    if (!vendor) return;
    setEditData({
      name: vendor.name || '',
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
    });
    setShowEdit(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVendor.mutate(editData);
  };

  const makePayment = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/vendors/${params.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to make payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', params.id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowPayment(false);
      setPaymentData({ amount: '', method: 'CASH', bankAccountId: '', reference: '', notes: '' });
    },
  });

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    makePayment.mutate({
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.method,
      bankAccountId: paymentData.bankAccountId || undefined,
      reference: paymentData.reference || undefined,
      notes: paymentData.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return <div className="text-center py-12 text-muted-foreground">Vendor not found</div>;
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/vendors">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{vendor.name}</h1>
          <p className="text-sm text-muted-foreground truncate">{vendor.contactPerson || 'No contact person'}</p>
        </div>
        <Button size="sm" variant="outline" onClick={openEditModal}>
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
      </div>

      {/* Contact Info */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{vendor.phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{vendor.email || 'No email'}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{vendor.address || 'No address'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Balance with Payment Button */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Account Balance
            </CardTitle>
            <Button size="sm" onClick={() => setShowPayment(true)} className="gradient-primary">
              <Plus className="h-4 w-4 mr-1" /> Pay
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className={`text-3xl font-bold ${parseFloat(vendor.balance || 0) > 0 ? 'text-amber-500' : 'text-primary'}`}>
            {formatCurrency(parseFloat(vendor.balance || 0))}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Outstanding balance with vendor</p>
        </CardContent>
      </Card>

      {/* Payment History */}
      {vendor.payments && vendor.payments.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {vendor.payments.map((payment: any) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <div>
                  <p className="font-medium text-foreground">{formatCurrency(parseFloat(payment.amount))}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.paymentMethod} • {formatDate(payment.createdAt)}
                  </p>
                </div>
                <span className="badge badge-success">Paid</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Products from this vendor */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Products
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {vendor.items && vendor.items.length > 0 ? (
            <div className="space-y-2">
              {vendor.items.slice(0, 10).map((item: any) => (
                <Link key={item.id} href={`/inventory/${item.id}`}>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(parseFloat(item.unitPrice))}</p>
                  </div>
                </Link>
              ))}
              {vendor.items.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  +{vendor.items.length - 10} more products
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No products from this vendor</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Make Payment to Vendor</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowPayment(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <select
                    className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                    value={paymentData.method}
                    onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                  >
                    <option value="CASH">Cash</option>
                    <option value="MOBILE_TRANSFER">Mobile Transfer</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
                {(paymentData.method === 'MOBILE_TRANSFER' || paymentData.method === 'CARD') && (
                  <div className="space-y-2">
                    <Label>Bank Account *</Label>
                    <select
                      className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                      value={paymentData.bankAccountId}
                      onChange={(e) => setPaymentData({ ...paymentData, bankAccountId: e.target.value })}
                      required
                    >
                      <option value="">Select bank account</option>
                      {bankAccounts?.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} - {acc.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    placeholder="Transaction reference"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowPayment(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary" disabled={makePayment.isPending}>
                    {makePayment.isPending ? 'Processing...' : 'Make Payment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border max-h-[90dvh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Edit Vendor</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowEdit(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input
                    value={editData.contactPerson}
                    onChange={(e) => setEditData({ ...editData, contactPerson: e.target.value })}
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
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowEdit(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary" disabled={updateVendor.isPending}>
                    {updateVendor.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
