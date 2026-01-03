// src/app/api/cron/database/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheManager } from '@/lib/cache/redis';

// Redis-based lock (simplified version)
const REFRESH_LOCK_KEY = 'rfm:refresh:lock';
const REFRESH_LOCK_TTL = 300; // 5 minutes
const REFRESH_LOCK_VALUE = 'locked';

interface LockStatus {
  isLocked: boolean;
  lockedAt?: string;
  expiresIn?: number;
}

async function acquireLock(): Promise<boolean> {
  try {
    // Check if lock already exists
    const existingLock = await cacheManager.get<string>(REFRESH_LOCK_KEY);
    if (existingLock) {
      return false;
    }
    
    // Set lock with TTL
    await cacheManager.set(
      REFRESH_LOCK_KEY, 
      REFRESH_LOCK_VALUE,
      REFRESH_LOCK_TTL
    );
    return true;
  } catch {
    return false;
  }
}

async function releaseLock(): Promise<void> {
  try {
    await cacheManager.delete(REFRESH_LOCK_KEY);
  } catch (error) {
    console.warn('Failed to release lock:', error);
  }
}

async function getLockStatus(): Promise<LockStatus> {
  try {
    const lock = await cacheManager.get<string>(REFRESH_LOCK_KEY);
    return {
      isLocked: lock === REFRESH_LOCK_VALUE,
      lockedAt: lock ? new Date().toISOString() : undefined,
      expiresIn: lock ? REFRESH_LOCK_TTL : 0
    };
  } catch {
    return { isLocked: false };
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Verify cron secret
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for existing lock
  const lockStatus = await getLockStatus();
  if (lockStatus.isLocked) {
    return NextResponse.json({
      success: false,
      message: 'Refresh already in progress',
      lockStatus,
      retryAfter: `${lockStatus.expiresIn}s`
    }, { status: 429 });
  }

  // Acquire lock
  const hasLock = await acquireLock();
  if (!hasLock) {
    return NextResponse.json({
      success: false,
      message: 'Failed to acquire lock (race condition)',
      lockStatus
    }, { status: 429 });
  }

  const startTime = Date.now();
  let refreshSucceeded = false;

  try {
    console.warn('Starting RFM view refresh...');
    
    // Run the refresh with timeout
    const refreshPromise = prisma.$executeRaw`SELECT refresh_rfm_scores_mv();`;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Refresh timeout after 90s')), 90000)
    );

    await Promise.race([refreshPromise, timeoutPromise]);
    
    refreshSucceeded = true;
    const duration = Date.now() - startTime;
    
    // Get updated stats
    const stats = await prisma.$queryRaw<{
      total_rows: bigint;
      last_updated: Date;
    }[]>`
      SELECT 
        COUNT(*) as total_rows,
        MAX(calculated_at) as last_updated
      FROM rfm_scores_mv;
    `;
    
    console.warn(`✅ RFM view refreshed in ${duration}ms. Rows: ${stats[0]?.total_rows}`);
    
    return NextResponse.json({
      success: true,
      message: 'RFM view refreshed successfully',
      duration: `${duration}ms`,
      stats: {
        totalRows: Number(stats[0]?.total_rows || 0),
        lastUpdated: stats[0]?.last_updated?.toISOString(),
        nextRefresh: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      lockReleased: true
    });

  } catch (error) {
    console.error('RFM view refresh failed:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Refresh failed',
      duration: `${Date.now() - startTime}ms`,
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      lockReleased: false
    }, { status: 500 });

  } finally {
    if (refreshSucceeded) {
      await releaseLock();
    }
    // If failed, keep lock to prevent repeated failures
  }
}

// Status endpoint
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [viewStats, lockStatus] = await Promise.all([
      prisma.$queryRaw<{
        exists: boolean;
        total_rows: bigint;
        last_updated: Date | null;
      }[]>`
        SELECT 
          EXISTS(
            SELECT FROM pg_matviews 
            WHERE schemaname = 'public' 
            AND matviewname = 'rfm_scores_mv'
          ) as exists,
          COALESCE(
            (SELECT COUNT(*) FROM rfm_scores_mv), 
            CAST(0 AS BIGINT)
          ) as total_rows,
          COALESCE(
            (SELECT MAX(calculated_at) FROM rfm_scores_mv), 
            NULL
          ) as last_updated;
      `,
      getLockStatus()
    ]);

    // Check view staleness
    const lastUpdated = viewStats[0]?.last_updated;
    const isStale = lastUpdated 
      ? Date.now() - new Date(lastUpdated).getTime() > 36 * 60 * 60 * 1000
      : true;

    return NextResponse.json({
      view: {
        exists: viewStats[0]?.exists || false,
        totalRows: Number(viewStats[0]?.total_rows || 0),
        lastUpdated: viewStats[0]?.last_updated?.toISOString(),
        isStale,
        stalenessHours: lastUpdated 
          ? Math.round((Date.now() - new Date(lastUpdated).getTime()) / (60 * 60 * 1000))
          : null
      },
      lock: lockStatus,
      recommendations: !viewStats[0]?.exists ? [
        'Run migration: npx prisma migrate deploy',
        'Or create view manually via Supabase SQL editor'
      ] : isStale ? [
        'View is stale. Trigger refresh via n8n workflow',
        'Or manually: curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/database/refresh'
      ] : []
    });

  } catch (error) {
    console.error('Failed to get refresh status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}