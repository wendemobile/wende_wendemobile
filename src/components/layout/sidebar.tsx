'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, memo, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/use-translation';
import { getVisibleNavItems, type NavItem } from '@/lib/nav-config';
import { Zap } from 'lucide-react';

// Memoized nav item for better performance
const SidebarNavItem = memo(function SidebarNavItem({
  item,
  isActive,
  onPrefetch
}: {
  item: NavItem;
  isActive: boolean;
  onPrefetch: (href: string) => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch={true}
      onMouseEnter={() => onPrefetch(item.href)}
      className={cn(
        'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors',
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      <item.icon
        className={cn(
          'mr-3 flex-shrink-0 h-5 w-5',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      {item.name}
    </Link>
  );
});

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();

  // Prefetch route on hover for instant navigation
  const handlePrefetch = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  const filteredNavigation = useMemo(() => {
    return getVisibleNavItems(session?.user?.role);
  }, [session]);

  if (!session) return null;

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow bg-card border-r border-border pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center glow-sm">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-base lg:text-xl font-bold text-foreground leading-tight">AB Pro</h1>
            <p className="text-xs text-muted-foreground">POS System</p>
          </div>
        </div>
        <div className="mt-8 flex-1 flex flex-col">
          <nav className="flex-1 px-3 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <SidebarNavItem
                  key={item.name}
                  item={{ ...item, name: t(item.name) }}
                  isActive={isActive}
                  onPrefetch={handlePrefetch}
                />
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-border">
          <div className="glass rounded-xl p-3">
            <p className="text-xs text-muted-foreground">System Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-foreground">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
