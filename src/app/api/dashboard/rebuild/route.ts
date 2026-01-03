// src/app/api/dashboard/rebuild/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPremiumDashboardData } from '@/lib/actions/premium-dashboard';

export async function POST(_request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.type !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ ADD: Block rebuild endpoint during freeze
  return NextResponse.json({
    error: 'Dashboard rebuild disabled per freeze rules',
    message: 'Use cron-based snapshot generation instead',
    note: 'Contact administrator for manual refresh if absolutely necessary'
  }, { status: 503 }); // Service Unavailable

  // ❌ DON'T add any code after return statement
}

// Optional: GET endpoint to check rebuild status
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user || session.user.type !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json(
      { error: 'clientId is required as query parameter' },
      { status: 400 }
    );
  }

  try {
    const snapshot = await getPremiumDashboardData(clientId);
    
    return NextResponse.json({
      clientId,
      exists: true,
      lastComputed: snapshot.computedAt,
      computationMode: snapshot.computationMode,
      cacheSource: snapshot.cacheSource,
      cacheKey: `snap:client:${clientId}:full`,
      ttl: '15 minutes',
      recommendations: snapshot.cacheSource === 'error' ? [
        'Snapshot generation failed. Check database connection.',
        'Make sure rfm_scores_mv materialized view exists.'
      ] : snapshot.computationMode === 'estimated' ? [
        'Using estimated mode. Materialized view might be stale or missing.',
        'Trigger refresh via /api/cron/database/refresh'
      ] : []
    });

  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check dashboard status' },
      { status: 500 }
    );
  }
}