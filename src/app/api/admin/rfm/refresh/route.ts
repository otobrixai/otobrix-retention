// src/app/api/admin/rfm/refresh/route.ts - FIX
import { NextRequest, NextResponse } from 'next/server';

// Cooldown guard to prevent rapid repeated refreshes
let lastRefreshAt = 0
const COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  const adminApiKey = request.headers.get('ADMIN_API_KEY');
  const validKey = process.env.ADMIN_API_KEY;

  if (!validKey || adminApiKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check cooldown before running refresh
    const now = Date.now()
    
    if (now - lastRefreshAt < COOLDOWN_MS) {
      return NextResponse.json({
        skipped: true,
        reason: 'RFM refresh cooldown active',
        nextAvailable: new Date(lastRefreshAt + COOLDOWN_MS).toISOString(),
        cooldownRemainingMs: lastRefreshAt + COOLDOWN_MS - now
      })
    }
    
    lastRefreshAt = now
    
    console.warn('🔄 Starting RFM view refresh via API...');

    // Dynamically import to avoid Prisma client issues at module level
    const { refreshRFMView } = await import('../../../../../../scripts/refresh-rfm-view');
    await refreshRFMView();

    return NextResponse.json({
      success: true,
      message: 'RFM view refreshed',
      timestamp: new Date().toISOString(),
      nextAvailableCooldown: new Date(now + COOLDOWN_MS).toISOString()
    });

  } catch (error: unknown) {
    console.error('❌ RFM refresh failed:', error);
    return NextResponse.json(
      {
        success: false, 
        error: 'RFM refresh failed',
      },
      { status: 500 }
    );
  }
}