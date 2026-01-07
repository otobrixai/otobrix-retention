// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'edge';
export const dynamic = 'force-dynamic'

export async function GET() {

  try {
		return NextResponse.json({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,
			region: process.env.VERCEL_REGION || 'local'
		})
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        runtime: 'edge'
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache',
        }
      }
    )
  }
}