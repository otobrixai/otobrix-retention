// src/app/api/dashboard/snapshot/[client_id]/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPremiumDashboardData } from '@/lib/actions/premium-dashboard';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ client_id: string }> }
) {
  const { client_id } = await context.params;
  const session = await auth();

  // Auth check
  if (!session?.user || session.user.type !== 'client' || session.user.clientId !== client_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Use your new snapshot system
    const snapshot = await getPremiumDashboardData(client_id);
    
    // Expand compact format for UI
    return NextResponse.json({
      client: snapshot.client,
      analytics: snapshot.analytics,
      recentActions: snapshot.recentActions,
      customerSegments: snapshot.customerSegments,
      computedAt: snapshot.computedAt,
      computationMode: snapshot.computationMode,
      cacheSource: snapshot.cacheSource,
      servedFrom: snapshot.cacheSource === 'redis' ? 'redis_cache' : 
                  snapshot.cacheSource === 'memory' ? 'memory_cache' : 'fresh_generation',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard API failed:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}