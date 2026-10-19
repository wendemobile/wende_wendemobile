'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Globe, Save, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function StoreSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    storeName: 'My Store',
    phone: '',
    email: '',
    address: '',
    website: '',
    taxId: '',
    currency: 'USD',
    taxRate: '0',
    receiptHeader: '',
    receiptFooter: 'Thank you for your purchase!',
  });

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('storeSettings');
    if (stored) {
      setFormData(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('storeSettings', JSON.stringify(formData));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Store Settings</h1>
          <p className="text-sm text-muted-foreground">Configure store information</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary">
          {saving ? 'Saving...' : saved ? 'Saved!' : <><Save className="h-4 w-4 mr-1" /> Save</>}
        </Button>
      </div>

      {/* Store Info */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Store Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <Label>Store Name *</Label>
            <Input
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="Your store name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="store@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Address
            </Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, Country"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website
              </Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourstore.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Tax ID / VAT Number</Label>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Tax identification"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Settings */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Financial Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <select
                className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 text-foreground"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="ETB">ETB - Ethiopian Birr</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="NGN">NGN - Nigerian Naira</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Default Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Settings */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Receipt Settings</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <Label>Receipt Header</Label>
            <Input
              value={formData.receiptHeader}
              onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
              placeholder="Text to show at top of receipt"
            />
          </div>
          <div className="space-y-2">
            <Label>Receipt Footer</Label>
            <Input
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              placeholder="Thank you message"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
