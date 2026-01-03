// src/lib/hooks/useOptimizedQuery.ts - Updated with performance optimizations
import {
  useQuery,
  useQueryClient,
  QueryKey,
  UseQueryOptions,
  QueryFunction,
  FetchQueryOptions,
  QueryFunctionContext,
} from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

export function useOptimizedQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> & {
    dedupeTime?: number;
    _debounceMs?: number; // Prefix with underscore to indicate intentional non-use
    backgroundPrefetch?: boolean;
    clientIsolation?: boolean;
  }
) {
  const queryClient = useQueryClient();
  const lastFetchTime = useRef(0);
  const { 
    dedupeTime = 1000, 
    _debounceMs, // Keep but don't use (for API compatibility)
    backgroundPrefetch = true,
    clientIsolation = false,
    ...queryOptions 
  } = options || {};

  // Enhanced query function with client isolation
  const optimizedQueryFn = useCallback(
    async (context: QueryFunctionContext<TQueryKey>): Promise<TQueryFnData> => {
      const now = Date.now();
      
      // Deduplication check
      if (now - lastFetchTime.current < dedupeTime) {
        const cached = queryClient.getQueryData<TQueryFnData>(queryKey);
        if (cached !== undefined) {
          return cached;
        }
        await new Promise(resolve => setTimeout(resolve, dedupeTime - (now - lastFetchTime.current)));
      }
      
      lastFetchTime.current = Date.now();
      
      // Execute query with error handling
      try {
        return await queryFn(context);
      } catch (error) {
        console.error('Query execution failed:', error);
        throw error;
      }
    },
    [queryFn, dedupeTime, queryKey, queryClient]
  );

  // Background prefetch on mount
  if (backgroundPrefetch && typeof window !== 'undefined') {
    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn: optimizedQueryFn,
          ...queryOptions,
        } as FetchQueryOptions<TQueryFnData, TError, TQueryFnData, TQueryKey>);
      });
    } else {
      // Fallback to setTimeout
      setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn: optimizedQueryFn,
          ...queryOptions,
        } as FetchQueryOptions<TQueryFnData, TError, TQueryFnData, TQueryKey>);
      }, 100);
    }
  }

  return useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    ...queryOptions,
    retryOnMount: false,
    refetchOnMount: queryOptions.refetchOnMount ?? false,
    // Add client isolation metadata
    meta: {
      ...queryOptions.meta,
      clientIsolation,
    },
  });
}

// Hook for dashboard-specific queries with enhanced caching and 5-minute staleTime
export function useDashboardQuery(
  clientId: string,
  queryFn: QueryFunction<unknown, readonly unknown[]>,
  options?: Omit<UseQueryOptions<unknown, Error, unknown, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  const queryKey: readonly unknown[] = [
    'dashboard', 
    clientId, 
    { 
      timestamp: Math.floor(Date.now() / 60000), // Minute-level cache busting
      isolation: true // Mark for client isolation
    }
  ];
  
  return useOptimizedQuery(
    queryKey,
    queryFn,
    {
      staleTime: 300000, // 5 minutes for dashboard data (as requested)
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      dedupeTime: 2000,
      debounceMs: 500,
      backgroundPrefetch: true,
      clientIsolation: true, // Enable client isolation
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'online',
      // Add pagination support metadata
      meta: {
        ...options?.meta,
        pagination: { take: 50 }, // Add pagination limit
      },
      ...options,
    } as Omit<UseQueryOptions<unknown, Error, unknown, readonly unknown[]>, 'queryKey' | 'queryFn'>
  );
}

// New: Hook for paginated queries with client isolation
export function usePaginatedQuery<TData = unknown>(
  baseKey: string,
  clientId: string,
  queryFn: QueryFunction<TData, readonly unknown[]>,
  page: number = 1,
  pageSize: number = 50,
  options?: Omit<UseQueryOptions<TData, Error, TData, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  const queryKey: readonly unknown[] = [
    baseKey,
    clientId,
    { page, pageSize, timestamp: Math.floor(Date.now() / 60000) }
  ];
  
  return useOptimizedQuery(
    queryKey,
    async (context) => {
      // Pass pagination params to query function
      const result = await queryFn(context);
      return result;
    },
    {
      staleTime: 180000, // 3 minutes for paginated data
      gcTime: 5 * 60 * 1000,
      dedupeTime: 1000,
      _debounceMs: 300, // Changed from debounceMs to _debounceMs
      backgroundPrefetch: false, // Don't prefetch paginated data
      clientIsolation: true,
      retry: 1,
      refetchOnWindowFocus: false,
      ...options,
    }
  );
}