'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Smartphone,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Menu,
  X,
  Lock,
  User,
  ShieldCheck,
  Headphones,
  MapPin,
  MessageCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { STORE_CONTACT } from '@/data/landing-products';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password. Please try again.');
      } else if (result?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Login failed. Please verify credentials.');
      }
    } catch {
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative selection:bg-primary/20 selection:text-primary">
      {/* Background ambient decorative glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/15 rounded-full blur-[100px]" />
      </div>

      {/* TOP HEADER WITH NAME: WENDE MOBILE BUTAJIRA & TOP 3-BAR MENU */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Top Name: Wende Mobile Butajira */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl p-1"
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                    Wende Mobile
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Butajira
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline-block">
                  Point of Sale & Inventory Portal
                </span>
              </div>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Storefront
              </Link>

              {/* TOP 3-BAR (HAMBURGER) MENU BUTTON */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close 3-bar menu' : 'Open 3-bar menu'}
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors touch-target-min"
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

        {/* 3-BAR DROPDOWN / DRAWER MENU */}
        {isMobileMenuOpen && (
          <div className="w-full bg-card/95 backdrop-blur-2xl border-b border-border shadow-2xl animate-in slide-in-from-top-3 duration-200">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Wende Mobile Navigation</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Butajira, Ethiopia</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary text-foreground transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Public Storefront</p>
                    <p className="text-[10px] text-muted-foreground">Return to main landing page</p>
                  </div>
                </Link>

                <Link
                  href="/#catalog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary text-foreground transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Smartphones Catalog</p>
                    <p className="text-[10px] text-muted-foreground">iPhone 16, Samsung Galaxy S24</p>
                  </div>
                </Link>

                <Link
                  href="/#catalog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary text-foreground transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center">
                    <Headphones className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">AirPods & Headsets</p>
                    <p className="text-[10px] text-muted-foreground">AirPods Max, Sony WH-1000XM5</p>
                  </div>
                </Link>

                <a
                  href={`https://wa.me/${STORE_CONTACT.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors border border-emerald-500/20"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold">WhatsApp Support</p>
                    <p className="text-[10px] text-emerald-400/80">{STORE_CONTACT.displayPhone}</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN LOGIN CARD SECTION */}
      <main className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12">
        <Card className="w-full max-w-md bg-card/90 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl relative z-10 overflow-hidden">
          <CardHeader className="space-y-4 text-center pb-2 pt-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Lock className="h-8 w-8 text-white" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-2">
                <Sparkles className="h-3 w-3" />
                Staff Sign In Portal
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-black text-foreground">
                Wende Mobile Butajira
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                Enter your credentials to manage POS, inventory & sales
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* USERNAME FIELD */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or cashier"
                    required
                    autoFocus
                    autoComplete="username"
                    className="pl-10 bg-secondary/80 border-border rounded-xl focus:border-primary text-sm h-11"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                    Password
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Case sensitive</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="pl-10 pr-12 bg-secondary/80 border-border rounded-xl focus:border-primary text-sm h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                className="w-full gradient-primary text-white font-bold text-sm sm:text-base rounded-2xl py-6 glow-primary touch-btn active:scale-95 transition-transform"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In to System'
                )}
              </Button>
            </form>

            {/* Quick Demo Fill Buttons */}
            <div className="mt-5 pt-4 border-t border-border/60 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground text-center">
                Quick Test Credentials:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('admin', 'admin123')}
                  className="text-left p-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/70 text-xs transition-colors"
                >
                  <span className="font-bold text-foreground block">Admin</span>
                  <span className="text-[10px] text-muted-foreground">admin / admin123</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('cashier', 'cashier123')}
                  className="text-left p-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/70 text-xs transition-colors"
                >
                  <span className="font-bold text-foreground block">Cashier</span>
                  <span className="text-[10px] text-muted-foreground">cashier / cashier123</span>
                </button>
              </div>
            </div>

            {/* Back to Storefront Link */}
            <div className="mt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Return to Wende Mobile Storefront & Catalog
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        <p>Wende Mobile Butajira • Butajira, Ethiopia</p>
      </footer>
    </div>
  );
}
