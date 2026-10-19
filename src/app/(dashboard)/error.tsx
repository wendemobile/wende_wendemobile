'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
      <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
        <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We encountered an unexpected error while trying to load this page. 
          Please try again or return to the dashboard.
        </p>
      </div>
      
      {/* Optional: Show error message in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-muted rounded-md text-left text-sm max-w-2xl overflow-auto border font-mono">
          <p className="text-red-500 font-semibold mb-1">{error.name}: {error.message}</p>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{error.stack}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button onClick={reset} size="lg" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
