// scripts/refresh-rfm-view.ts - FINAL WITH BIGINT LOCK
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function refreshRFMView() {
  const startTime = Date.now();
  
  try {
    // Use BigInt for Postgres advisory lock compatibility
    const LOCK_KEY = BigInt(123456); // BigInt for Postgres advisory lock
    
    const lockResult = await prisma.$queryRaw<Array<{pg_try_advisory_lock: boolean}>>`
      SELECT pg_try_advisory_lock(${LOCK_KEY}) as pg_try_advisory_lock
    `;
    
    if (!lockResult[0]?.pg_try_advisory_lock) {
      console.warn('⚠️ RFM view refresh already in progress, skipping...');
      return;
    }
    
    try {
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY rfm_scores_mv`;
      const duration = Date.now() - startTime;
      console.warn(`✅ RFM view refreshed successfully in ${duration}ms`);
      
    } finally {
      // Always release the advisory lock
      await prisma.$executeRaw`SELECT pg_advisory_unlock(${LOCK_KEY})`;
      console.warn('🔓 Advisory lock released');
    }
    
  } catch (error) {
    const err = error as Error;
    console.error('❌ Failed to refresh RFM view:', err);
    throw error;
  }
}

// Export for programmatic use
export { refreshRFMView };

// Run only when explicitly invoked as a standalone script
if (process.env.RUN_AS_SCRIPT === 'true') {
  refreshRFMView()
    .then(async () => {
      console.warn('🎉 RFM refresh complete!');
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error: Error) => {
      console.error('💥 RFM refresh failed:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}