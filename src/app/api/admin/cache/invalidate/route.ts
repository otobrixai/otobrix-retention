// src/app/api/admin/cache/invalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache/redis';

export async function POST(request: NextRequest) {
  // Check for admin API key
  const adminApiKey = request.headers.get('ADMIN_API_KEY');
  const validKey = process.env.ADMIN_API_KEY;
  
  if (!validKey || adminApiKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { clientId } = body;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required in body' },
        { status: 400 }
      );
    }
    
    console.warn(`🔄 Invalidating cache for client: ${clientId}`);
    
    // Delete client dashboard cache - works with both memory and Redis
    void cacheManager.delete(`dashboard:premium:${clientId}`);
    
    return NextResponse.json({
      success: true,
      message: `Cache invalidated for client ${clientId}`,
      timestamp: new Date().toISOString(),
      note: 'Only primary dashboard cache invalidated'
    });
    
  } catch (error: unknown) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cache invalidation failed' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    note: 'Use POST with clientId to invalidate specific cache'
  });
}