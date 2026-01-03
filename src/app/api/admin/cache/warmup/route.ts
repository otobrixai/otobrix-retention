// src/app/api/admin/cache/warmup/route.ts
import { warmupSnapshots } from '@/lib/cache/warmup'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST() {
  const h = await headers()
  const secret = h.get('x-admin-secret')

  if (secret !== process.env.ADMIN_WARMUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await warmupSnapshots()
    return NextResponse.json({
      success: true,
      warmedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Cache warmup failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
