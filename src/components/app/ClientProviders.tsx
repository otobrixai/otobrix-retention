// src/components/app/ClientProviders.tsx - ULTRA SIMPLE
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'

// Create queryClient outside
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
})

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <Toaster position="top-right" theme="dark" />
        </TooltipProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}