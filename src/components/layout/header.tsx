'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { User, LogOut, Menu, Search, X, Sun, Moon, Globe, Package, Users, Receipt, ArrowLeftRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n/use-translation';
import { useI18nStore } from '@/lib/i18n/store';
import { locales, LocaleKey } from '@/lib/i18n/locales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import { getVisibleNavItems } from '@/lib/nav-config';

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

import { useUIStore } from '@/lib/store';

export function Header({ user }: HeaderProps) {
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { locale, setLocale } = useI18nStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateSearch = (url: string) => {
    setSearchQuery('');
    setSearchResults(null);
    setShowMobileSearch(false);
    router.push(url);
  };

  const hasResults = searchResults && (
    searchResults.items?.length > 0 ||
    searchResults.customers?.length > 0 ||
    searchResults.sales?.length > 0 ||
    searchResults.transfers?.length > 0
  );

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const cycleLanguage = () => {
    const keys = Object.keys(locales) as LocaleKey[];
    const currentIndex = keys.indexOf(locale);
    const nextIndex = (currentIndex + 1) % keys.length;
    setLocale(keys[nextIndex]);
  };

  // Filter mobile nav items based on user role permissions (shared config)
  const filteredMobileNavItems = useMemo(() => {
    return getVisibleNavItems(session?.user?.role);
  }, [session]);

  return (
    <>
      <header className="glass border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="touch-btn"
              onClick={openMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-sm sm:text-lg font-bold text-primary truncate">Wende Mobile Butajira</h1>
          </div>

          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-md relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search anything...') || "Search anything..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-8 bg-secondary border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto p-2 space-y-2">
                {isSearching ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Searching...</p>
                ) : !hasResults ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No results found</p>
                ) : (
                  <>
                    {searchResults.items?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">Items</p>
                        {searchResults.items.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => handleNavigateSearch(`/inventory/${item.id}`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary text-left transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="h-4 w-4 text-primary shrink-0" />
                              <div className="truncate">
                                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-primary shrink-0 ml-2">{formatCurrency(Number(item.unitPrice))}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.customers?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">Customers</p>
                        {searchResults.customers.map((c: any) => (
                          <button
                            key={c.id}
                            onClick={() => handleNavigateSearch(`/customers/${c.id}`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary text-left transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Users className="h-4 w-4 text-blue-500 shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">{c.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.transfers?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">Transfers</p>
                        {searchResults.transfers.map((tr: any) => (
                          <button
                            key={tr.id}
                            onClick={() => handleNavigateSearch(`/transfers/${tr.id}`)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary text-left transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ArrowLeftRight className="h-4 w-4 text-amber-500 shrink-0" />
                              <span className="text-sm font-mono text-primary">{tr.transferNumber}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{tr.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              title="Search"
              className="md:hidden touch-btn text-muted-foreground hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={cycleLanguage}
              title={`Switch Language (${locales[locale]?.name})`}
              className="touch-btn text-muted-foreground hover:text-foreground relative"
            >
              <Globe className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-white rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {locale.toUpperCase()}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title="Toggle theme"
              className="touch-btn text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Link href="/profile" className="flex items-center gap-2 ml-1 sm:ml-2 hover:opacity-80 transition-opacity">
              <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/login', redirect: true })}
              title="Sign out"
              className="touch-btn text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {showMobileSearch && (
          <div className="md:hidden px-4 pb-3 border-t border-border/50 pt-2 bg-card/95 backdrop-blur-xl animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={t('Search anything...') || "Search items, customers, transfers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 bg-secondary border-border"
              />
              <button
                onClick={() => { setShowMobileSearch(false); setSearchQuery(''); setSearchResults(null); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className="mt-2 bg-secondary/60 border border-border rounded-xl max-h-72 overflow-y-auto p-2 space-y-2">
                {isSearching ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Searching...</p>
                ) : !hasResults ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No results found</p>
                ) : (
                  <>
                    {searchResults.items?.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavigateSearch(`/inventory/${item.id}`)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-background text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="h-4 w-4 text-primary shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-primary shrink-0 ml-2">{formatCurrency(Number(item.unitPrice))}</span>
                      </button>
                    ))}
                    {searchResults.customers?.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => handleNavigateSearch(`/customers/${c.id}`)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-background text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{c.phone}</span>
                      </button>
                    ))}
                    {searchResults.transfers?.map((tr: any) => (
                      <button
                        key={tr.id}
                        onClick={() => handleNavigateSearch(`/transfers/${tr.id}`)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-background text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ArrowLeftRight className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="text-sm font-mono text-primary">{tr.transferNumber}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{tr.status}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-lg font-bold text-primary">{t('Menu')}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMobileMenu}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 pb-20">
              {filteredMobileNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{t(item.name)}</span>
                  </Link>
                );
              })}
            </nav>
            {/* Bottom safe area padding */}
            <div className="shrink-0 p-3 border-t border-border bg-card space-y-2">
              <Link
                href="/profile"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              >
                <User className="h-5 w-5" />
                <span className="font-medium">My Profile</span>
              </Link>
              <div className="text-xs text-muted-foreground text-center">
                Logged in as {user.name}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
