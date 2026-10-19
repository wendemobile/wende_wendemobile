'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from './providers/theme-provider';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 30 * 60 * 1000, // 30 minutes
            refetchOnWindowFocus: false,
            refetchOnMount: true, // Always ensure fresh data when navigating between pages
            refetchOnReconnect: true,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            networkMode: 'offlineFirst',
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
            networkMode: 'offlineFirst',
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider 
        refetchOnWindowFocus={false} 
        refetchInterval={0}
        refetchWhenOffline={false}
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              className:
                '!bg-card !text-card-foreground !border !border-border !rounded-xl !shadow-xl !text-sm !font-medium',
              success: { iconTheme: { primary: 'hsl(142 76% 46%)', secondary: '#fff' } },
              error: { iconTheme: { primary: 'hsl(0 84% 60%)', secondary: '#fff' } },
            }}
          />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
