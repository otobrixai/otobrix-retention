// scripts/clear-cache.ts
import { cacheManager } from '../src/lib/cache/redis';

async function clearProblematicCache() {
  console.info('🧹 Clearing problematic cache entries...');
  
  // Clear specific cache keys that might be corrupted
  const problematicKeys = [
    'anonymous:0',
    'getDashboardStats:0', 
    'cached:getDashboardStats',
    'getDashboardStatsCached:0'
  ];
  
  for (const key of problematicKeys) {
    const deleted = await cacheManager.delete(key);
    console.info(`🗑️ ${deleted ? 'Cleared' : 'Failed to clear'}: ${key}`);
  }
  
  console.info('✅ Cache cleared successfully!');
}

// Run the function
clearProblematicCache()
  .then(() => {
    console.info('🎉 Cache clearance completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error clearing cache:', error);
    process.exit(1);
  });