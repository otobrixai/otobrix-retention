// Create: src/lib/clear-cache.ts
import { cacheManager } from './cache/redis';

export async function clearAllCache() {
  console.log('🧹 Clearing ALL cache entries...');
  
  try {
    await cacheManager.clear();
    console.log('✅ All cache cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Run this once to clear corrupted cache
if (process.env.NODE_ENV === 'development') {
  clearAllCache().catch(console.error);
}