'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/landing/login-modal';
import {
  Menu,
  X,
  Smartphone,
  Headphones,
  MapPin,
  Lock,
  Sun,
  Moon,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
  Phone,
  Sparkles,
  UserCheck,
  LayoutDashboard,
} from 'lucide-react';
import { STORE_CONTACT } from '@/data/landing-products';

interface NavbarProps {
  onCategorySelect?: (category: 'all' | 'smartphones' | 'headsets') => void;
}

export function Navbar({ onCategorySelect }: NavbarProps) {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const handleNavClick = (sectionId: string, category?: 'all' | 'smartphones' | 'headsets') => {
    setIsMobileMenuOpen(false);
    if (category && onCategorySelect) {
      onCategorySelect(category);
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Name */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl p-1"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Wende Mobile
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Butajira
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline-block">
                  Smartphones • AirPods • Audio
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => handleNavClick('catalog', 'smartphones')}
                className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/70 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Smartphone className="h-4 w-4 text-primary" />
                Smartphones
              </button>
              <button
                onClick={() => handleNavClick('catalog', 'headsets')}
                className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/70 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Headphones className="h-4 w-4 text-purple-400" />
                AirPods & Headsets
              </button>
              <button
                onClick={() => handleNavClick('store-info')}
                className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/70 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <MapPin className="h-4 w-4 text-emerald-400" />
                Store Location
              </button>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Staff Sign In / Dashboard (Desktop) */}
              {session ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/dashboard">
                    <Button className="gradient-primary text-white rounded-xl shadow-md glow-sm flex items-center gap-2 font-medium">
                      <LayoutDashboard className="h-4 w-4" />
                      POS Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  variant="outline"
                  className="hidden sm:flex items-center gap-2 rounded-xl border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-foreground font-medium transition-all"
                >
                  <Lock className="h-4 w-4 text-primary" />
                  Staff Login
                </Button>
              )}

              {/* TOP 3-BAR (HAMBURGER) MENU BUTTON */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open 3-bar menu'}
                className="relative inline-flex items-center justify-center p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors touch-target-min"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE SLIDE-OUT / DROPDOWN MENU */}
        {isMobileMenuOpen && (
          <div className="w-full bg-card/95 backdrop-blur-2xl border-b border-border shadow-2xl transition-all animate-in slide-in-from-top-4 duration-200">
            <div className="max-w-7xl mx-auto px-4 pt-3 pb-6 space-y-4">
              {/* Brand Header inside Menu */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Wende Mobile Butajira</p>
                    <p className="text-[11px] text-muted-foreground">Premier Mobile & Audio Showroom</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Open Today
                </span>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <button
                  onClick={() => handleNavClick('catalog', 'smartphones')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary text-foreground text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Flagship Smartphones</p>
                      <p className="text-[11px] text-muted-foreground">iPhone 16 Pro Max, Samsung S24, Pixel</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => handleNavClick('catalog', 'headsets')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary text-foreground text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                      <Headphones className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">AirPods & Headsets</p>
                      <p className="text-[11px] text-muted-foreground">AirPods Max, AirPods Pro 2, Sony ANC</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => handleNavClick('store-info')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary text-foreground text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Butajira Store Location & Hours</p>
                      <p className="text-[11px] text-muted-foreground">Commercial Center • Open 8:30 AM – 8:00 PM</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                <a
                  href={`https://wa.me/${STORE_CONTACT.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-left transition-colors border border-emerald-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Chat with Us on WhatsApp</p>
                      <p className="text-[11px] text-emerald-400/80">Instant price check & order</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-emerald-400" />
                </a>
              </div>

              {/* STAFF & ADMIN LOGIN ACTION */}
              <div className="pt-2 border-t border-border/60">
                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-primary/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Store Staff Portal
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Authorized access for cashiers, salesmen, and managers to log sales and manage inventory.
                  </p>

                  {session ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-secondary/80 rounded-xl">
                        <UserCheck className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-medium text-foreground">
                          Logged in as <strong className="text-primary">{session.user?.name}</strong> ({session.user?.role})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href="/dashboard" className="w-full">
                          <Button className="w-full gradient-primary text-white rounded-xl text-xs font-semibold py-2">
                            Dashboard
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => signOut()}
                          className="w-full rounded-xl text-xs text-red-400 border-red-500/20 hover:bg-red-500/10"
                        >
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsLoginModalOpen(true);
                        }}
                        className="w-full gradient-primary text-white rounded-xl py-3 font-semibold glow-sm flex items-center justify-center gap-2 touch-btn"
                      >
                        <Lock className="h-4 w-4" />
                        Sign In with Username & Password
                      </Button>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <p className="text-[11px] text-center text-muted-foreground hover:text-foreground underline pt-1">
                          Or open full login page →
                        </p>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Login Modal Prompt */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
