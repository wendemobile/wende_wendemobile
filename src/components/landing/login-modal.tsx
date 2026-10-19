'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Lock, User, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
        onClose();
        router.push('/dashboard');
        router.refresh();
      } else {
        setError('Login failed. Please verify your credentials.');
      }
    } catch {
      setError('An error occurred while connecting. Please try again.');
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="space-y-2 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-1">
              <Sparkles className="h-3 w-3" />
              Staff & Admin Portal
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Wende Mobile Butajira
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
              Enter your credentials to access POS & Store Management
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="modal-username" className="text-xs font-medium text-muted-foreground">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="modal-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoComplete="username"
                className="pl-9 bg-secondary border-border rounded-xl focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="modal-password" className="text-xs font-medium text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="pl-9 pr-10 bg-secondary border-border rounded-xl focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary glow-sm font-semibold text-white rounded-xl py-5 touch-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In to POS'
            )}
          </Button>

          {/* Quick Demo Fill */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground text-center mb-2">
              Quick Test Credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin', 'admin123')}
                className="text-[11px] py-1.5 px-2 bg-secondary/80 hover:bg-secondary border border-border rounded-lg text-foreground/80 hover:text-foreground transition-colors"
              >
                Admin (admin / admin123)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('cashier', 'cashier123')}
                className="text-[11px] py-1.5 px-2 bg-secondary/80 hover:bg-secondary border border-border rounded-lg text-foreground/80 hover:text-foreground transition-colors"
              >
                Cashier (cashier / cashier123)
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
