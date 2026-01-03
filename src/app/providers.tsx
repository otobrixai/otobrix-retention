// src/app/providers.tsx - FIXED VERSION (NO ERRORBOUNDARY)
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
        networkMode: 'online',
        refetchOnReconnect: true,
        refetchIntervalInBackground: false,
        structuralSharing: true,
        // Add retry delay to prevent DoS
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        networkMode: 'online',
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  }));

  return (
    // REMOVED: <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          refetchInterval={30 * 60} // 30 minutes
          refetchOnWindowFocus={false}
          refetchWhenOffline={false}
        >
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            expand={false}
            richColors
            closeButton
            toastOptions={{
              className: 'bg-slate-800 border border-slate-700',
              duration: 4000,
            }}
          />
        </SessionProvider>
      </QueryClientProvider>
    // REMOVED: </ErrorBoundary>
  )
}