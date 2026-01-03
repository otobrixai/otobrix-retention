// src/app/api/cache/stats/route.ts - Cache statistics
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cacheManager } from '@/lib/cache/redis';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const stats = await cacheManager.getStats();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...stats
    });
    
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache statistics' },
      { status: 500 }
    );
  }
}