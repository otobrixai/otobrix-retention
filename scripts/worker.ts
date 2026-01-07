// scripts/worker.ts - Enhanced with TypeScript types
import { Redis } from '@upstash/redis';
import { PrismaClient } from '@prisma/client';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const prisma = new PrismaClient();

// Distributed lock helper
async function acquireLock(key: string, ttl: number = 300): Promise<boolean> {
  try {
    const result = await redis.set(key, 'locked', { nx: true, ex: ttl });
    return result === 'OK';
  } catch (error) {
    console.error('Failed to acquire lock:', error);
    return false;
  }
}

async function releaseLock(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Failed to release lock:', error);
  }
}

interface SnapshotData {
  clientId: string;
  generatedAt: string;
  roi: {
    recoveredLast30Days: number;
    projectedNext30Days: number;
    totalAtRiskRevenue: number;
    potentialRecoveryRate: number;
  };
  leaderboard: Array<{
    customer_id: string;
    churn_score: number;
    predicted_churn_reason: string;
    ltv: number;
  }>;
  rfmSegments: Array<{
    recency: number;
    frequency: number;
    monetary: number;
    count: number;
    label: string;
  }>;
}

async function generateSnapshotWithRetry(clientId: string, maxRetries: number = 3): Promise<SnapshotData | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.info(`Generating snapshot for client ${clientId}, attempt ${attempt}`);
      
      // Simulate snapshot generation - replace with actual logic
      const snapshot: SnapshotData = {
        clientId,
        generatedAt: new Date().toISOString(),
        roi: {
          recoveredLast30Days: Math.random() * 10000,
          projectedNext30Days: Math.random() * 15000,
          totalAtRiskRevenue: Math.random() * 50000,
          potentialRecoveryRate: 35
        },
        leaderboard: Array.from({ length: 50 }, (_, i) => ({
          customer_id: `cust_${i}`,
          churn_score: 70 + Math.random() * 30,
          predicted_churn_reason: ['Price', 'Service', 'Competitor', 'Product'][i % 4],
          ltv: 1000 + Math.random() * 4000
        })),
        rfmSegments: [
          { recency: 1, frequency: 1, monetary: 1, count: 100, label: 'Champions' },
          { recency: 2, frequency: 2, monetary: 2, count: 200, label: 'Loyal' },
          { recency: 3, frequency: 3, monetary: 3, count: 150, label: 'At Risk' },
          { recency: 4, frequency: 4, monetary: 4, count: 75, label: 'Can\'t Lose' },
          { recency: 5, frequency: 5, monetary: 5, count: 50, label: 'New' }
        ]
      };

      // Cache the snapshot with retry logic
      const cacheKey = `snap:client:${clientId}:full`;
      let cacheSuccess = false;
      
      for (let cacheAttempt = 1; cacheAttempt <= 2; cacheAttempt++) {
        try {
          await redis.set(cacheKey, JSON.stringify(snapshot), { ex: 300 }); // 5 minutes TTL
          cacheSuccess = true;
          break;
        } catch (cacheError) {
          console.warn(`Cache write attempt ${cacheAttempt} failed:`, cacheError);
          if (cacheAttempt === 2) throw cacheError;
        }
      }

      if (cacheSuccess) {
        console.info(`✅ Successfully generated and cached snapshot for client ${clientId}`);
        return snapshot;
      }
      
    } catch (error: unknown) {
      console.error(`Attempt ${attempt} failed for client ${clientId}:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.info(`Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  return null;
}

interface Client {
  client_id: string;
}

async function warmupSnapshots(): Promise<void> {
  const lockKey = 'worker:snapshot:lock';
  const hasLock = await acquireLock(lockKey, 300); // 5 minute lock
  
  if (!hasLock) {
    console.info('Another worker is already generating snapshots, skipping...');
    return;
  }

  try {
    console.info('🚀 Starting snapshot warmup...');
    const warmupStart = Date.now();

    // Get active clients - with retry for DB cold starts
    let clients: Client[] = [];
    try {
      clients = await prisma.clients.findMany({
        where: { status: 'active' },
        select: { client_id: true },
        take: 10 // Limit for safety
      });
    } catch (dbError) {
      console.error('DB connection failed, waiting and retrying...', dbError);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retry once
      clients = await prisma.clients.findMany({
        where: { status: 'active' },
        select: { client_id: true },
        take: 10
      });
    }

    console.info(`Generating snapshots for ${clients.length} clients...`);

    // Generate snapshots in parallel with concurrency limit
    const concurrencyLimit = 3;
    const results: (SnapshotData | null)[] = [];
    
    for (let i = 0; i < clients.length; i += concurrencyLimit) {
      const batch = clients.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(client => 
        generateSnapshotWithRetry(client.client_id)
          .catch(error => {
            console.error(`Failed to generate snapshot for client ${client.client_id}:`, error);
            return null;
          })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the system
      if (i + concurrencyLimit < clients.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successful = results.filter(r => r !== null).length;
    const failed = results.filter(r => r === null).length;
    
    const duration = Date.now() - warmupStart;
    console.info(`✅ Warmup completed in ${duration}ms: ${successful} successful, ${failed} failed`);

  } catch (error) {
    console.error('❌ Warmup failed:', error);
  } finally {
    await releaseLock(lockKey);
    console.info('🔓 Released worker lock');
  }
}

// Main worker loop
async function main(): Promise<void> {
  console.info('🔄 Starting snapshot worker...');
  
  while (true) {
    try {
      await warmupSnapshots();
    } catch (error) {
      console.error('Worker iteration failed:', error);
    }
    
    // Wait 2 minutes before next run
    console.info('💤 Sleeping for 2 minutes...');
    await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info('🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.info('🛑 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(console.error);