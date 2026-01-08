
// src/app/api/health/full/route.ts - Fixed version
import { NextResponse } from 'next/server'
import { cacheManager } from '@/lib/cache'
import { prisma } from '@/lib/prisma'

function getMemoryUsage() {
  const usage = process.memoryUsage()
  return {
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
    external: Math.round(usage.external / 1024 / 1024) + ' MB',
  }
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Basic system info
    const memoryUsage = getMemoryUsage()
    
    // Cache health check with safe property access
    const cacheStats = await cacheManager.getStats()
    const cacheHealth = 'connected' in cacheStats ? cacheStats.connected : true
    const keyCount = ('keyCount' in cacheStats ? cacheStats.keyCount : 0) || 
                    ('size' in cacheStats ? cacheStats.size : 0) || 
                    ('itemCount' in cacheStats ? cacheStats.itemCount : 0)
    
    // Database health check
    let dbHealth = false
    let dbResponseTime = 0
    try {
      const dbStart = Date.now()
      // Use template literal syntax which works with PrismaPg adapter
      await prisma.$queryRaw`SELECT 1`
      dbResponseTime = Date.now() - dbStart
      dbHealth = true
    } catch (_error) {
      dbHealth = false
    }

    // Redis health check (via cache)
    const redisHealth = cacheHealth
    
    // Overall health
    const isHealthy = dbHealth && redisHealth
    const responseTime = Date.now() - startTime

    const health = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: responseTime + 'ms',
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      runtime: 'nodejs',
      
      checks: {
        database: {
          status: dbHealth ? 'healthy' : 'unhealthy',
          responseTime: dbResponseTime + 'ms',
          details: dbHealth ? 'Connection successful' : 'Connection failed'
        },
        cache: {
          status: redisHealth ? 'healthy' : 'unhealthy',
          keyCount: keyCount,
          details: cacheHealth ? 'Cache connected' : 'Cache connection failed'
        },
        memory: memoryUsage
      },
      
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    }

    return NextResponse.json(health, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        runtime: 'nodejs'
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