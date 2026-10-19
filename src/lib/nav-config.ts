import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  AlertTriangle,
  Building2,
  Clock,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { hasPermission } from '@/lib/permissions';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Layaways', href: '/layaways', icon: Layers },
  { name: 'Credits', href: '/credits', icon: CreditCard },
  { name: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Money', href: '/money-management', icon: Wallet },
  { name: 'Bank Accounts', href: '/bank-accounts', icon: Building2 },
  { name: 'Sessions', href: '/sessions', icon: Clock },
  { name: 'Defects', href: '/defects', icon: AlertTriangle },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Stock Movement', href: '/reports/stock', icon: ArrowLeftRight },
  { name: 'Commissions', href: '/reports/commissions', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

/** Single source of truth for role-based nav visibility. */
export function canSeeNavItem(name: string, role: string): boolean {
  switch (name) {
    case 'Dashboard': return true;
    case 'POS': return hasPermission(role, 'sales:write');
    case 'Inventory': return hasPermission(role, 'items:read');
    case 'Customers': return hasPermission(role, 'customers:read');
    case 'Layaways': return true;
    case 'Credits': return hasPermission(role, 'credits:read');
    case 'Transfers': return hasPermission(role, 'transfers:read');
    case 'Expenses': return hasPermission(role, 'expenses:read');
    case 'Money': return hasPermission(role, 'finance:read');
    case 'Bank Accounts': return hasPermission(role, 'bank-accounts:read');
    case 'Sessions': return hasPermission(role, 'sessions:read');
    case 'Defects': return hasPermission(role, 'defects:read');
    case 'Vendors': return hasPermission(role, 'vendors:read');
    case 'Reports': return hasPermission(role, 'reports:view');
    case 'Stock Movement': return role === 'ADMIN' || role === 'BASEMENT_MANAGER';
    case 'Commissions': return role === 'ADMIN';
    case 'Settings': return hasPermission(role, 'settings:read');
    default: return true;
  }
}

export function getVisibleNavItems(role: string | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => canSeeNavItem(item.name, role));
}
