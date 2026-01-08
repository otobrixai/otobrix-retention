import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { memoryCache } from '@/lib/cache/memory-cache'

export async function GET() {
  const start = Date.now()

  let db = 'down'
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    db = 'up'
  } catch {}

  const cache = memoryCache ? 'up' : 'down'

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    services: {
      api: 'up',
      database: db,
      cache,
      queue: 'assumed-up', // you don’t have a hard signal yet
    },
  })
}
