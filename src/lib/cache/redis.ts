// src/lib/cache/redis.ts — MEMORY ONLY (production simplified)

import { cacheManager as memoryCache } from './memory-cache';

export const CACHE_TTL = {
  DASHBOARD: 300,
  CLIENTS: 180,
  SESSIONS: 1800,
  RATE_LIMIT: 900,
};

export const CACHE_KEYS = {
  DASHBOARD: 'dashboard:data',
  CLIENTS_LIST: 'clients:list',
  CLIENT_DETAILS: (id: string) => `client:${id}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  RATE_LIMIT: (id: string) => `rate_limit:${id}`,
};

export function generateCacheKey(prefix: string, ...args: unknown[]): string {
  return `${prefix}:${JSON.stringify(args).slice(0, 120)}`;
}

export const cacheManager = {
  get: memoryCache.get,
  set: memoryCache.set,
  delete: memoryCache.delete,
  has: memoryCache.has,
  mget: memoryCache.mget,
  mset: memoryCache.mset,
  incr: memoryCache.incr,
  ttl: memoryCache.ttl,
  clear: memoryCache.clear,
  setex: memoryCache.setex,
  getStats: memoryCache.getStats,
  async healthCheck() {
    const stats = await memoryCache.getStats();
    return {
      redis: 'not-configured',
      memory: 'healthy',
      stats,
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cached<T extends (...args: any[]) => Promise<any>>(
  ttl: number = CACHE_TTL.CLIENTS
): (fn: T) => T {
  return function (fn: T): T {
    const fnName = fn.name || 'anonymous';

    const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const key = generateCacheKey(`cached:${fnName}`, ...args);

      const hit = await cacheManager.get<ReturnType<T>>(key);
      if (hit !== null && hit !== undefined) {
        return hit;
      }

      const result = await fn(...args);

      if (result !== undefined && result !== null) {
        await cacheManager.set(key, result, ttl);
      }

      return result;
    };

    Object.defineProperty(wrapped, 'name', {
      value: `${fnName}_cached`,
      writable: false,
    });

    return wrapped as T;
  };
}
