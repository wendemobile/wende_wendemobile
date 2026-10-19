'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, MapPin, Building2, ChevronRight,
  AlertTriangle, Shield, Database, Bell
} from 'lucide-react';
import Link from 'next/link';

const settingsItems = [
  {
    id: 'users',
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    icon: Users,
    href: '/settings/users',
    color: 'blue'
  },
  {
    id: 'locations',
    name: 'Locations',
    description: 'Manage store and warehouse locations',
    icon: MapPin,
    href: '/settings/locations',
    color: 'emerald'
  },
  {
    id: 'store',
    name: 'Store Settings',
    description: 'Configure store information and preferences',
    icon: Building2,
    href: '/settings/store',
    color: 'purple'
  },
  {
    id: 'roles',
    name: 'Roles & Permissions',
    description: 'Configure access control and permissions',
    icon: Shield,
    href: '/settings/roles',
    color: 'amber'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Configure alerts and notification settings',
    icon: Bell,
    href: '/settings/notifications',
    color: 'pink'
  },
  {
    id: 'error-logs',
    name: 'Error Logs',
    description: 'View system errors and debug information',
    icon: AlertTriangle,
    href: '/settings/error-logs',
    color: 'red'
  },
];

export default function SettingsPage() {
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations?pageSize=1');
      return res.json();
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const res = await fetch('/api/users?pageSize=1');
      return res.json();
    },
  });

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string }> = {
      blue: { bg: 'bg-blue-500/20', icon: 'text-blue-500' },
      emerald: { bg: 'bg-emerald-500/20', icon: 'text-emerald-500' },
      purple: { bg: 'bg-purple-500/20', icon: 'text-purple-500' },
      amber: { bg: 'bg-amber-500/20', icon: 'text-amber-500' },
      pink: { bg: 'bg-pink-500/20', icon: 'text-pink-500' },
      red: { bg: 'bg-red-500/20', icon: 'text-red-500' },
    };
    return colors[color] || colors.blue;
  };

  const getSubtitle = (id: string) => {
    switch (id) {
      case 'users':
        return `${users?.data?.total || 0} users`;
      case 'locations':
        return `${locations?.data?.total || locations?.data?.length || 0} locations`;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Manage system configuration</p>
      </div>

      {/* Settings Grid - single column on very small screens */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {settingsItems.map((item) => {
          const colors = getColorClasses(item.color);
          const Icon = item.icon;
          const subtitle = getSubtitle(item.id);

          return (
            <Link key={item.id} href={item.href}>
              <Card className="mobile-card hover:border-primary/30 transition-all h-full active:scale-[0.99]">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.icon}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{item.name}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.description}</p>
                        {subtitle && (
                          <p className="text-[10px] sm:text-xs text-primary mt-0.5 sm:mt-1">{subtitle}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* System Info */}
      <Card className="mobile-card">
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 bg-secondary rounded-xl">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Version</p>
              <p className="font-medium text-foreground text-sm sm:text-base">1.0.0</p>
            </div>
            <div className="p-2 sm:p-3 bg-secondary rounded-xl">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Database</p>
              <p className="font-medium text-foreground text-sm sm:text-base truncate">PostgreSQL</p>
            </div>
            <div className="p-2 sm:p-3 bg-secondary rounded-xl">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Environment</p>
              <p className="font-medium text-foreground text-sm sm:text-base truncate">Development</p>
            </div>
            <div className="p-2 sm:p-3 bg-secondary rounded-xl">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Status</p>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="font-medium text-emerald-500 text-sm sm:text-base">Online</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
