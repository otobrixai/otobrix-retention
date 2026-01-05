// src/app/api/cron/snapshot/route.ts - CORRECTED
import { NextRequest, NextResponse } from 'next/server'
import { generateAdminSnapshot } from '@/lib/snapshots/generate-admin-snapshot'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 1. Auth check
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret) {
    console.error('❌ CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  
  if (authHeader !== `Bearer ${expectedSecret}`) {
    console.warn('❌ Unauthorized cron attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Generate snapshot (await fully)
  try {
    console.warn('🔄 Cron: Starting admin snapshot generation...')
    const result = await generateAdminSnapshot()  // ✅ AWAIT FULLY
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      duration: result.duration,
      stats: {
        totalClients: result.totalClients,
        activeClients: result.activeClients,
        totalClientUsers: result.totalClientUsers
      }
    })
    
  } catch (error) {
    console.error('❌ Cron snapshot failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate snapshot',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}