'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bell, Package, CreditCard, AlertTriangle, Save, Check, X } from 'lucide-react';
import Link from 'next/link';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  icon: any;
  enabled: boolean;
}

export default function NotificationsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { key: 'lowStock', label: 'Low Stock Alerts', description: 'Get notified when items fall below minimum stock', icon: Package, enabled: true },
    { key: 'creditDue', label: 'Credit Due Reminders', description: 'Alerts for upcoming and overdue credit payments', icon: CreditCard, enabled: true },
    { key: 'dailySummary', label: 'Daily Sales Summary', description: 'Receive daily sales report notifications', icon: Bell, enabled: false },
    { key: 'systemErrors', label: 'System Error Alerts', description: 'Get notified about critical system errors', icon: AlertTriangle, enabled: true },
  ]);
  const [thresholds, setThresholds] = useState({
    lowStockDays: '7',
    creditReminderDays: '3',
  });

  useEffect(() => {
    const stored = localStorage.getItem('notificationSettings');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.settings) setSettings(data.settings);
      if (data.thresholds) setThresholds(data.thresholds);
    }
  }, []);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      return data.data || [];
    },
  });

  const toggleSetting = (key: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('notificationSettings', JSON.stringify({ settings, thresholds }));
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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Configure alerts and notifications</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary">
          {saving ? 'Saving...' : saved ? 'Saved!' : <><Save className="h-4 w-4 mr-1" /> Save</>}
        </Button>
      </div>

      {/* Notification Settings */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Alert Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {settings.map((setting) => (
            <div key={setting.key} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${setting.enabled ? 'bg-primary/20' : 'bg-muted'}`}>
                <setting.icon className={`h-5 w-5 ${setting.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{setting.label}</p>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </div>
              <button
                onClick={() => toggleSetting(setting.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${setting.enabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${setting.enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Low Stock Warning (days of supply)</Label>
              <Input
                type="number"
                value={thresholds.lowStockDays}
                onChange={(e) => setThresholds({ ...thresholds, lowStockDays: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Credit Reminder (days before due)</Label>
              <Input
                type="number"
                value={thresholds.creditReminderDays}
                onChange={(e) => setThresholds({ ...thresholds, creditReminderDays: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notif: any) => (
                <div key={notif.id} className={`p-3 rounded-xl ${notif.isRead ? 'bg-secondary/30' : 'bg-secondary/50 border-l-2 border-primary'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
