// src/app/api/admin/cache/status/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cacheManager } from '@/lib/cache/redis';

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await cacheManager.getStats();
    
    return NextResponse.json({
      status: 'ok',
      cache: {
        connected: stats.connected,
        keyCount: stats.keyCount,
        itemCount: stats.itemCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message 
      },
      { status: 500 }
    );
  }
}