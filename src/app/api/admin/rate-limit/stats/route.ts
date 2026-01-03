// src/app/api/admin/rate-limit/stats/route.ts - UPDATED
import { NextResponse } from 'next/server';
import { getRateLimitStats } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/server-auth';

export async function GET() {
  try {
    // Only allow admin access to rate limit stats
    await requireAdmin();
    
    const stats = await getRateLimitStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[API ERROR] Rate limit stats fetch failed');
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch rate limit statistics'
      },
      { status: 500 }
    );
  }
}