// src/app/api/metrics/route.ts
import { otelMetrics } from '@/lib/otel';
import { cacheManager } from '@/lib/cache/redis';
import { Pool } from 'pg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple Prometheus-style metrics formatter
function formatMetric(name: string, value: number, help: string = '', type: string = 'counter'): string {
  return `# HELP ${name} ${help}
# TYPE ${name} ${type}
${name} ${value}
`;
}

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Get basic system metrics
    const memoryUsage = process.memoryUsage();
    
    // Get cache stats
    let cacheStats;
    try {
      cacheStats = await cacheManager.getStats();
    } catch (_error) {
      cacheStats = { connected: false, keyCount: 0 };
    }
    
    // Get database connection status
    let dbConnected = false;
    try {
      // Use pool directly to avoid PrismaPg adapter issues
      const connectionString = process.env.DATABASE_URL_WITH_POOLER || process.env.DATABASE_URL;
      if (connectionString) {
        const pool = new Pool({ connectionString, max: 1 });
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
          dbConnected = true;
        } finally {
          client.release();
          await pool.end();
        }
      }
    } catch {
      dbConnected = false;
    }
    
    // Get application metrics
    const appMetrics = otelMetrics.getMetrics();
    
    // Build Prometheus metrics response
    const metrics = [
      // Application metrics
      formatMetric('otobrix_requests_total', appMetrics.requests, 'Total number of HTTP requests'),
      formatMetric('otobrix_cache_hits_total', appMetrics.cacheHits, 'Total number of cache hits'),
      formatMetric('otobrix_cache_misses_total', appMetrics.cacheMisses, 'Total number of cache misses'),
      formatMetric('otobrix_rate_limited_total', appMetrics.rateLimited, 'Total number of rate-limited requests'),
      formatMetric('otobrix_errors_total', appMetrics.errors, 'Total number of application errors'),
      formatMetric('otobrix_database_queries_total', appMetrics.databaseQueries, 'Total number of database queries'),
      
      // System metrics
      formatMetric('otobrix_memory_rss_bytes', memoryUsage.rss, 'Resident Set Size memory usage in bytes', 'gauge'),
      formatMetric('otobrix_memory_heap_total_bytes', memoryUsage.heapTotal, 'Total heap size in bytes', 'gauge'),
      formatMetric('otobrix_memory_heap_used_bytes', memoryUsage.heapUsed, 'Used heap size in bytes', 'gauge'),
      formatMetric('otobrix_memory_external_bytes', memoryUsage.external, 'External memory usage in bytes', 'gauge'),
      
      // Uptime
      formatMetric('otobrix_uptime_seconds', process.uptime(), 'Application uptime in seconds', 'gauge'),
      
      // Health status (0 = down, 1 = up)
      formatMetric('otobrix_cache_connected', cacheStats.connected ? 1 : 0, 'Cache connection status (1=connected, 0=disconnected)', 'gauge'),
      formatMetric('otobrix_database_connected', dbConnected ? 1 : 0, 'Database connection status (1=connected, 0=disconnected)', 'gauge'),
      formatMetric('otobrix_cache_keys_total', cacheStats.keyCount || 0, 'Total number of keys in cache', 'gauge'),
      
      // Performance metrics
      formatMetric('otobrix_response_time_ms', Date.now() - startTime, 'Metrics endpoint response time in milliseconds', 'gauge'),
    ];
    
    // Add node.js version as info metric
    const nodeVersion = process.version.replace('v', '');
    metrics.push(`otobrix_node_version{version="${nodeVersion}"} 1\n`);
    
    // Add environment info
    metrics.push(`otobrix_environment{env="${process.env.NODE_ENV || 'unknown'}"} 1\n`);
    
    // Add Vercel region if available
    if (process.env.VERCEL_REGION) {
      metrics.push(`otobrix_region{region="${process.env.VERCEL_REGION}"} 1\n`);
    }
    
    const responseBody = metrics.join('\n');
    
    return new Response(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-store, max-age=0',
        'X-Metrics-Endpoint': 'enabled',
      },
    });
    
  } catch (error) {
    console.error('[METRICS] Error generating metrics:', error);
    
    // Fallback to minimal metrics on error
    const fallbackMetrics = formatMetric('otobrix_metrics_endpoint_error', 1, 'Metrics endpoint error occurred');
    
    return new Response(fallbackMetrics, {
      status: 200, // Return 200 even on error to not break monitoring
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-store, max-age=0',
        'X-Metrics-Error': 'true',
      },
    });
  }
}