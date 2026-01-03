// src/lib/cache.ts - CORRECTED VERSION
import { LRUCache } from 'lru-cache'; // CHANGED THIS LINE
import { memoryCache } from '@/lib/cache/memory-cache'

// Cache configuration
const cache = new LRUCache<string, Record<string, unknown>>({
  max: 100, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

export const cacheManager = {
  // Get data from cache
  get<T>(key: string): T | undefined {
    return cache.get(key) as T;
  },

  // Set data in cache
  set<T extends Record<string, unknown>>(
    key: string,
    value: T,
    ttl?: number
  ): void {
    cache.set(key, value, { ttl: ttl || 1000 * 60 * 5 });
  },

  // Delete data from cache
  delete(key: string): void {
    cache.delete(key);
  },

  // Clear all cache
  clear(): void {
    cache.clear();
  },

  // Check if key exists
  has(key: string): boolean {
    return cache.has(key);
  },

  // Get cache stats
  getStats() {
    return {
      size: cache.size,
      max: cache.max,
      itemCount: cache.size,
    };
  },
};

// Cache keys
export const CACHE_KEYS = {
  CLIENTS_LIST: 'clients:list',
  CLIENT_DETAILS: (id: string) => `client:${id}`,
  CLIENT_STATS: 'clients:stats',
};

// Generate cache key with prefix
export function generateCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}:${args.join(':')}`;
}

const SETTINGS_KEY = 'admin:settings'

export type AdminSettings = {
  maintenanceMode: boolean
  disableAutomations: boolean
}

export function getAdminSettings(): AdminSettings {
  return {
    maintenanceMode:
      memoryCache.get(`${SETTINGS_KEY}:maintenance`) ??
      process.env.MAINTENANCE_MODE === 'true',

    disableAutomations:
      memoryCache.get(`${SETTINGS_KEY}:disable_ai`) ??
      process.env.DISABLE_AI === 'true',
  }
}

export function setAdminSetting(
  key: keyof AdminSettings,
  value: boolean
) {
  memoryCache.set(`${SETTINGS_KEY}:${key}`, value, { ttl: 0 })
}
