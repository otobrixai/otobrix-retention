import { NextResponse } from 'next/server'
import { memoryCache } from '@/lib/cache/memory-cache'
import { Pool } from 'pg'

export async function GET() {
  const start = Date.now()

  let db = 'down'
  try {
    // Use pool directly to avoid PrismaPg adapter issues
    const connectionString = process.env.DATABASE_URL_WITH_POOLER || process.env.DATABASE_URL
    if (connectionString) {
      const pool = new Pool({ connectionString, max: 1 })
      const client = await pool.connect()
      try {
        await client.query('SELECT 1')
        db = 'up'
      } finally {
        client.release()
        await pool.end()
      }
    }
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
