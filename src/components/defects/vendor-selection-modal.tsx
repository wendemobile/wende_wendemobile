'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Search, Truck, Check } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface VendorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (vendorId: string, notes?: string) => void;
  isLoading?: boolean;
}

export function VendorSelectionModal({ isOpen, onClose, onConfirm, isLoading }: VendorSelectionModalProps) {
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [notes, setNotes] = useState('');

  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ['vendors', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('query', search);
      const res = await fetch(`/api/vendors?${params}`);
      const data = await res.json();
      return data.data?.items || data.data || [];
    },
    enabled: isOpen,
  });

  const handleConfirm = () => {
    if (selectedVendor) {
      onConfirm(selectedVendor.id, notes || undefined);
    }
  };

  const handleClose = () => {
    setSelectedVendor(null);
    setNotes('');
    setSearch('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card border-border max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-500" />
            Send to Vendor
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto flex-1">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Vendor</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Vendor List */}
          <div className="space-y-2">
            <Label>Select Vendor</Label>
            <div className="bg-secondary/50 rounded-xl border border-border/50 max-h-48 overflow-y-auto">
              {loadingVendors ? (
                <div className="p-4 text-center text-muted-foreground">Loading vendors...</div>
              ) : vendors.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No vendors found</div>
              ) : (
                vendors.map((vendor: Vendor) => (
                  <button
                    key={vendor.id}
                    type="button"
                    className={`w-full p-3 text-left hover:bg-secondary transition-colors flex items-center justify-between ${
                      selectedVendor?.id === vendor.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    <div>
                      <span className="text-foreground font-medium">{vendor.name}</span>
                      {vendor.phone && (
                        <span className="text-muted-foreground text-sm ml-2">• {vendor.phone}</span>
                      )}
                    </div>
                    {selectedVendor?.id === vendor.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Selected Vendor Display */}
          {selectedVendor && (
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/30">
              <p className="text-sm text-muted-foreground">Selected:</p>
              <p className="font-medium text-foreground">{selectedVendor.name}</p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about the repair needed..."
              className="w-full h-20 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedVendor || isLoading} 
              className="flex-1 gradient-primary"
            >
              {isLoading ? 'Sending...' : 'Send to Vendor'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
