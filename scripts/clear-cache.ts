// scripts/clear-cache.ts
import { cacheManager } from '../src/lib/cache/redis';

async function clearProblematicCache() {
  console.log('🧹 Clearing problematic cache entries...');
  
  // Clear specific cache keys that might be corrupted
  const problematicKeys = [
    'anonymous:0',
    'getDashboardStats:0', 
    'cached:getDashboardStats',
    'getDashboardStatsCached:0'
  ];
  
  for (const key of problematicKeys) {
    const deleted = await cacheManager.delete(key);
    console.log(`🗑️ ${deleted ? 'Cleared' : 'Failed to clear'}: ${key}`);
  }
  
  console.log('✅ Cache cleared successfully!');
}

// Run the function
clearProblematicCache()
  .then(() => {
    console.log('🎉 Cache clearance completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error clearing cache:', error);
    process.exit(1);
  });