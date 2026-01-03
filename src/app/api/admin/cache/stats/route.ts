// src/app/api/admin/cache/stats/route.ts
import { NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache/redis';

export async function GET() {
  try {
    const stats = await cacheManager.getStats();
    
    return NextResponse.json({
      success: true,
      message: 'Cache stats retrieved successfully',
      timestamp: new Date().toISOString(),
      data: stats
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to get cache stats',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
