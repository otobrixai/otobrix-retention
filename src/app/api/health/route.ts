// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { cacheManager } from '@/lib/cache'

export const runtime = 'edge';
export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Cache health check with safe property access
    const cacheStats = await cacheManager.getStats()
    const cacheHealth = 'connected' in cacheStats ? cacheStats.connected : true
    const keyCount = ('keyCount' in cacheStats ? cacheStats.keyCount : 0) || 
                    ('size' in cacheStats ? cacheStats.size : 0) || 
                    ('itemCount' in cacheStats ? cacheStats.itemCount : 0)
    
    // Database health check - not available in Edge runtime
    const dbDetails = 'Database check not available in Edge runtime'
    
    // Redis health check (via cache)
    const redisHealth = cacheHealth
    
    // Overall health - only check cache for Edge runtime
    const isHealthy = redisHealth
    const responseTime = Date.now() - startTime

    const health = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: responseTime + 'ms',
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      runtime: 'edge',
      
      checks: {
        database: {
          status: 'info',
          responseTime: '0ms',
          details: dbDetails
        },
        cache: {
          status: redisHealth ? 'healthy' : 'unhealthy',
          keyCount: keyCount,
          details: cacheHealth ? 'Cache connected' : 'Cache connection failed'
        },
        memory: {
          rss: 'N/A (Edge Runtime)',
          heapTotal: 'N/A (Edge Runtime)', 
          heapUsed: 'N/A (Edge Runtime)',
          external: 'N/A (Edge Runtime)',
        }
      },
      
      // System metrics for monitoring
      metrics: {
        nodeVersion: 'Edge Runtime',
        platform: 'Vercel Edge'
      }
    }

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