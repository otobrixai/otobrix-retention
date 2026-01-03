import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cacheManager, CACHE_TTL } from '@/lib/cache/redis';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await cacheManager.getStats();

    return NextResponse.json({
      status: 'ok',
      cache: {
        type: 'memory',
        connected: true,
        ttl: CACHE_TTL,
        stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Cache health check failed',
      },
      { status: 500 }
    );
  }
}
