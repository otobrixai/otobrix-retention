// src/lib/actions/premium-dashboard.ts - PRODUCTION-GRADE SNAPSHOT WRITER (CLEANED)
import { prisma } from '@/lib/prisma';
import { cacheManager } from '@/lib/cache/redis';

const SNAPSHOT_TTL = 900; // 15 minutes
const SNAPSHOT_PREFIX = 'snap:client';

// Helper to create snapshot key
const snapshotKey = (clientId: string) => `${SNAPSHOT_PREFIX}:${clientId}:full`;

interface ClientInfo {
  client_id: string;
  company_name: string | null;
  client_name: string | null;
  email: string | null;
  status: string | null;
}

interface Analytics {
  totalCustomers: number;
  highRiskCustomers: number;
  recoveryRate: number; // Always 0-100, probability of recovery
  totalRevenue: number;
  highValueCustomers: number;
}

interface RecentAction {
  action: string | null;
  status: string | null;
  timestamp: Date | null;
}

interface CustomerSegment {
  segment: string;
  count: number;
}


// Pure snapshot, no runtime metadata
export interface DashboardSnapshot {
  client: ClientInfo;
  analytics: Analytics;
  recentActions: RecentAction[];
  customerSegments: CustomerSegment[];
  computedAt: string;
  computationMode: 'precise' | 'estimated';
  cacheSource?: 'redis' | 'memory' | 'fresh' | 'error'; // Add 'error' here
}

interface RFMViewStats {
  total_customers: bigint;
  avg_churn_score?: number;
  at_risk_count: bigint;
  total_revenue: number;
  high_value_count?: bigint;
  regular_count?: bigint;
  recent_count?: bigint;
  last_updated?: Date; // Added this field
}

interface FallbackStats {
  total_customers: bigint;
  avg_churn_score?: number;
  at_risk_count: bigint;
  total_revenue: number;
}

type AggregatedStats = RFMViewStats | FallbackStats;

// Simple memory cache fallback
const memoryCache = new Map<string, { data: DashboardSnapshot; timestamp: number }>();

// Enhanced cache manager
const enhancedCache = {
  get: async (clientId: string): Promise<DashboardSnapshot | null> => {
    const key = snapshotKey(clientId);
    
    try {
      // Try Redis first
      const redisData = await cacheManager.get<DashboardSnapshot>(key);
      if (redisData) return redisData;
    } catch (error) {
      console.warn('Redis get failed:', error);
    }
    
    // Fallback to memory
    const memoryData = memoryCache.get(key);
    if (memoryData && Date.now() - memoryData.timestamp < 5 * 60 * 1000) {
      return memoryData.data;
    }
    
    return null;
  },
  
  set: async (clientId: string, snapshot: DashboardSnapshot, ttl: number): Promise<void> => {
    const key = snapshotKey(clientId);
    
    try {
      // Try Redis first
      await cacheManager.set(key, snapshot, ttl);
    } catch (error) {
      console.warn('Redis set failed, using memory:', error);
    }
    
    // Always cache in memory as fallback
    memoryCache.set(key, {
      data: snapshot,
      timestamp: Date.now()
    });
    
    // Clean up old memory entries (optional)
    if (memoryCache.size > 100) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      for (const [cacheKey, entry] of memoryCache.entries()) {
        if (entry.timestamp < oneHourAgo) {
          memoryCache.delete(cacheKey);
        }
      }
    }
  },
  
  delete: async (clientId: string): Promise<void> => {
    const key = snapshotKey(clientId);
    
    try {
      await cacheManager.delete(key);
    } catch (error) {
      console.warn('Redis delete failed:', error);
    }
    
    memoryCache.delete(key);
  }
};

async function fetchRFMAggregatedData(clientId: string): Promise<{
  stats: AggregatedStats;
  mode: 'precise' | 'estimated';
}> {
  // Check if materialized view exists first to avoid errors
  try {
    const viewExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(
        SELECT FROM pg_matviews 
        WHERE schemaname = 'public' 
        AND matviewname = 'rfm_scores_mv'
      ) as exists
    `;
    
    if (viewExists[0]?.exists) {
      // View exists, try to query it
      try {
        const rfmResult = await prisma.$queryRaw<RFMViewStats[]>`
          SELECT 
            COUNT(*) as total_customers,
            COALESCE(AVG(churn_score)::float, 0) as avg_churn_score,
            COUNT(CASE WHEN customer_segment = 'At Risk' THEN 1 END) as at_risk_count,
            COUNT(CASE WHEN customer_segment = 'High Value' THEN 1 END) as high_value_count,
            COUNT(CASE WHEN customer_segment = 'Regular' THEN 1 END) as regular_count,
            COUNT(CASE WHEN customer_segment = 'Recent Customers' THEN 1 END) as recent_count,
            COALESCE(SUM(total_spent), 0) as total_revenue,
            MAX(calculated_at) as last_updated
          FROM rfm_scores_mv
          WHERE client_id = ${clientId}
          LIMIT 1
        `;
        
        const stats = rfmResult[0];
        if (stats) {
          // Check if view is stale (>36 hours old)
          const viewAge = stats.last_updated ? Date.now() - new Date(stats.last_updated).getTime() : Infinity;
          const isStale = viewAge > 36 * 60 * 60 * 1000;
          
          return {
            stats,
            mode: isStale ? 'estimated' : 'precise'
          };
        }
      } catch (error) {
        // View exists but query failed - use fallback
        console.warn('Materialized view query failed, using fallback:', error);
      }
    }
  } catch (error) {
    // View existence check failed - use fallback
    console.warn('Could not check materialized view existence, using fallback:', error);
  }
  
  // IMPROVED FALLBACK: Use 365-day window
  try {
    const fallbackResult = await prisma.$queryRaw<FallbackStats[]>`
      WITH customer_365d AS (
        SELECT DISTINCT customer_id
        FROM retention_logs
        WHERE client_id = ${clientId}
          AND timestamp >= NOW() - INTERVAL '365 days'
      ),
      customer_metrics AS (
        SELECT 
          customer_id,
          AVG(churn_score) as avg_churn_score,
          SUM(COALESCE(recovered_revenue, 0)) as customer_revenue,
          MAX(timestamp) as last_purchase
        FROM retention_logs
        WHERE client_id = ${clientId}
          AND timestamp >= NOW() - INTERVAL '365 days'
        GROUP BY customer_id
      )
      SELECT 
        COUNT(*) as total_customers,
        COALESCE(AVG(avg_churn_score)::float, 0) as avg_churn_score,
        COUNT(CASE WHEN avg_churn_score > 0.7 THEN 1 END) as at_risk_count,
        COALESCE(SUM(customer_revenue), 0) as total_revenue
      FROM customer_metrics;
    `;
    
    return {
      stats: fallbackResult[0] || {
        total_customers: BigInt(0),
        avg_churn_score: 0,
        at_risk_count: BigInt(0),
        total_revenue: 0
      },
      mode: 'estimated' as const
    };
  } catch (error) {
    console.error('Fallback aggregation also failed:', error);
    
    // Ultimate fallback
    return {
      stats: {
        total_customers: BigInt(0),
        avg_churn_score: 0,
        at_risk_count: BigInt(0),
        total_revenue: 0
      },
      mode: 'estimated' as const
    };
  }
}

export async function getPremiumDashboardData(clientId: string): Promise<DashboardSnapshot> {
  // Use enhanced cache
  const existing = await enhancedCache.get(clientId);
  if (existing) {
    return existing;
  }

  try {
    // Sequential operations to avoid pool pressure
    // 1. Get client info first
    const client = await prisma.clients.findUnique({
      where: { client_id: clientId },
      select: {
        client_id: true,
        company_name: true,
        client_name: true,
        email: true,
        status: true,
      }
    });
    
    if (!client) {
      throw new Error('Client not found');
    }
    
    // 2. Get aggregated stats
    const aggregatedData = await fetchRFMAggregatedData(clientId);
    
    // 3. Get recent actions
    const recentActions = await prisma.retention_logs.findMany({
      where: {
        client_id: clientId,
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: { action: true, status: true, timestamp: true },
      take: 5,
      orderBy: { timestamp: 'desc' }
    });
    
    const stats = aggregatedData.stats;
    const totalCustomers = Number(stats.total_customers);
    const safeTotalCustomers = Math.max(totalCustomers, 0);
    
    const isPreciseMode = aggregatedData.mode === 'precise';
    
    // Standardize recoveryRate meaning (probability 0-100)
    const churnScore = stats.avg_churn_score ?? 0;
    const recoveryRate = Math.max(0, Math.min(100, Math.round((1 - churnScore) * 100)));
    
    const snapshot: DashboardSnapshot = {
      client,
      analytics: {
        totalCustomers,
        highRiskCustomers: isPreciseMode 
          ? Number((stats as RFMViewStats).at_risk_count)
          : Number((stats as FallbackStats).at_risk_count) || 0,
        recoveryRate,
        totalRevenue: Number(stats.total_revenue),
        highValueCustomers: isPreciseMode
          ? Number((stats as RFMViewStats).high_value_count || 0)
          : safeTotalCustomers > 0 ? Math.round(safeTotalCustomers * 0.25) : 0,
      },
      recentActions,
      customerSegments: isPreciseMode 
        ? [
            { segment: 'Regular', count: Number((stats as RFMViewStats).regular_count || 0) },
            { segment: 'Recent Customers', count: Number((stats as RFMViewStats).recent_count || 0) },
            { segment: 'At Risk', count: Number((stats as RFMViewStats).at_risk_count) },
            { segment: 'High Value', count: Number((stats as RFMViewStats).high_value_count || 0) },
          ].filter(segment => segment.count > 0)
        : (() => {
            if (safeTotalCustomers === 0) {
              return [];
            }
            
            const regular = Math.floor(safeTotalCustomers * 0.6);
            const recent = Math.floor(safeTotalCustomers * 0.2);
            const atRisk = Math.floor(safeTotalCustomers * 0.15);
            const highValue = safeTotalCustomers - (regular + recent + atRisk);
            
            const segments = [
              { segment: 'Regular', count: regular },
              { segment: 'Recent Customers', count: recent },
              { segment: 'At Risk', count: atRisk },
              { segment: 'High Value', count: highValue },
            ].filter(segment => segment.count > 0);
            
            return segments;
          })(),
      computedAt: new Date().toISOString(),
      computationMode: aggregatedData.mode,
      cacheSource: 'fresh' as const
    };
    
    // Write to snapshot cache
    await enhancedCache.set(clientId, snapshot, SNAPSHOT_TTL);
    
    return snapshot;
    
  } catch (error) {
    const err = error as Error;
    console.error('Dashboard data fetch failed:', err);
    
    // Last resort: empty snapshot
    const emptySnapshot: DashboardSnapshot = {
      client: { 
        client_id: clientId, 
        client_name: 'Loading...', 
        company_name: 'Loading...', 
        email: '', 
        status: 'active' 
      },
      analytics: { 
        totalCustomers: 0, 
        highRiskCustomers: 0, 
        recoveryRate: 0, 
        totalRevenue: 0,
        highValueCustomers: 0 
      },
      recentActions: [],
      customerSegments: [],
      computedAt: new Date().toISOString(),
      computationMode: 'estimated',
      cacheSource: 'error' as const
    };
    
    // Cache the empty snapshot
    await enhancedCache.set(clientId, emptySnapshot, Math.min(SNAPSHOT_TTL, 60));
    
    return emptySnapshot;
  }
}

// Simplified invalidation - single cache layer
export async function invalidateDashboardSnapshot(clientId?: string) {
  try {
    if (clientId) {
      await enhancedCache.delete(clientId);
      console.warn(`Snapshot cache invalidated for client: ${clientId}`);
    } else {
      console.warn('Bulk snapshot invalidation requires Redis SCAN or patterns');
    }
  } catch (error) {
    const err = error as Error;
    console.warn('Snapshot cache invalidation failed:', err.message);
  }
}

// Helper function for API routes
export const getSnapshotKey = snapshotKey;