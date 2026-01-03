// src/lib/cache/memory-cache.ts
import { LRUCache } from 'lru-cache';
import superjson from 'superjson';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CacheValue = any;

export const memoryCache = new LRUCache<string, CacheValue>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export const cacheManager = {
  async get<T>(key: string): Promise<T | null> {
    const value = memoryCache.get(key);
    if (value === undefined) return null;
    
    if (typeof value === 'string') {
      try {
        return superjson.parse(value) as T;
      } catch {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
    }
    return value as T;
  },

  async set(key: string, value: CacheValue, ttl?: number): Promise<boolean> {
    try {
      const storageValue = superjson.stringify(value);
      memoryCache.set(key, storageValue, { ttl: ttl || 1000 * 60 * 5 });
      return true;
    } catch (error) {
      console.error('Memory cache set error:', error);
      return false;
    }
  },

  async delete(key: string): Promise<boolean> {
    try {
      const existed = memoryCache.has(key);
      memoryCache.delete(key);
      return existed;
    } catch (error) {
      console.error('Memory cache delete error:', error);
      return false;
    }
  },

  async has(key: string): Promise<boolean> {
    return memoryCache.has(key);
  },

  async getStats() {
    return {
      connected: true,
      keyCount: memoryCache.size,
      keys: Array.from(memoryCache.keys()).slice(0, 10),
      size: memoryCache.size,
      max: 500,
      itemCount: memoryCache.size,
    };
  },

  async clear(): Promise<void> {
    memoryCache.clear();
  },

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return keys.map(key => {
      const value = memoryCache.get(key);
      if (value === undefined) return null;
      
      if (typeof value === 'string') {
        try {
          return superjson.parse(value) as T;
        } catch {
          try {
            return JSON.parse(value) as T;
          } catch {
            return value as T;
          }
        }
      }
      return value as T;
    });
  },

  async mset(data: Record<string, CacheValue>, ttl?: number): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(data)) {
        const storageValue = superjson.stringify(value);
        memoryCache.set(key, storageValue, { ttl: ttl || 1000 * 60 * 5 });
      }
      return true;
    } catch (error) {
      console.error('Memory cache mset error:', error);
      return false;
    }
  },


  async incr(key: string, initialValue: number = 0): Promise<number> {
    const currentRaw = memoryCache.get(key);
    let current = initialValue;
    
    if (currentRaw !== undefined) {
      if (typeof currentRaw === 'string') {
        try {
          current = superjson.parse<number>(currentRaw);
        } catch {
          current = initialValue;
        }
      } else if (typeof currentRaw === 'number') {
        current = currentRaw;
      }
    }
    
    const newValue = current + 1;
    memoryCache.set(key, superjson.stringify(newValue));
    return newValue;
  },

  // FIXED: Proper TTL implementation
  async ttl(key: string): Promise<number> {
    const remainingMs = memoryCache.getRemainingTTL(key);
    if (remainingMs === 0) return -1;
    if (remainingMs === Infinity) return -2;
    return Math.floor(remainingMs / 1000);
  },

  async setex(key: string, value: CacheValue, ttl: number): Promise<boolean> {
    const storageValue = superjson.stringify(value);
    memoryCache.set(key, storageValue, { ttl: ttl * 1000 });
    return true;
  }
};