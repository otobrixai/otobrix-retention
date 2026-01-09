// src/domain/dashboard/dashboard.repository.ts
import { prisma } from '@/lib/prisma';
import {
  ClientStats,
  RFMSegment,
  AdminDashboardStats,
  ClientNotFoundError
} from './dashboard.types';

// Define types locally instead of importing them
export interface ClientInfo {
  client_id: string;
  company_name: string | null;
  client_name: string | null;
  email: string | null;
  status: string | null;
}

export interface Analytics {
  totalCustomers: number;
  highRiskCustomers: number;
  recoveryRate: number;
  totalActions: number;
  totalRevenue: number;
  highValueCustomers: number;
}

export interface RecentAction {
  action: string | null;
  status: string | null;
  timestamp: Date | null;
}

export interface CustomerSegment {
  segment: string;
  count: number;
}

export interface DashboardData {
  client: ClientInfo;
  analytics: Analytics;
  recentActions: RecentAction[];
  customerSegments: CustomerSegment[];
  source: string;
  cacheHit: boolean | string;
  lastUpdated: string;
}

// Type for raw query result
interface ClientStatResult {
  client_id: string;
  total_actions: bigint;
  recovered_revenue: number;
  high_risk_customers: bigint;
}

export class DashboardRepository {
  // Client-specific queries
  async getClientInfo(clientId: string): Promise<ClientInfo> {
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
      throw new ClientNotFoundError(clientId);
    }

    return client;
  }

  async getRecentActions(clientId: string, limit: number = 5): Promise<RecentAction[]> {
    return await prisma.retention_logs.findMany({
      where: {
        client_id: clientId,
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: { action: true, status: true, timestamp: true },
      take: limit,
      orderBy: { timestamp: 'desc' }
    });
  }

  async getClientStats(clientId: string): Promise<ClientStats> {
    const result = await prisma.$queryRaw<ClientStatResult[]>`
      SELECT 
        client_id,
        COUNT(*) as total_actions,
        COALESCE(SUM(recovered_revenue), 0) as recovered_revenue,
        COUNT(CASE WHEN churn_score > 0.7 THEN 1 END) as high_risk_customers
      FROM retention_logs
      WHERE client_id = ${clientId}
        AND timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY client_id
    `;

    const stats = result[0] || {
      client_id: clientId,
      total_actions: BigInt(0),
      recovered_revenue: 0,
      high_risk_customers: BigInt(0)
    };

    return {
      client_id: stats.client_id,
      total_actions: Number(stats.total_actions),
      recovered_revenue: stats.recovered_revenue,
      high_risk_customers: Number(stats.high_risk_customers)
    };
  }

  async getRFMSegments(clientId: string): Promise<RFMSegment[]> {
    try {
      // First try to query from materialized view if it exists
      const viewExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS(
          SELECT FROM pg_matviews 
          WHERE schemaname = 'public' 
          AND matviewname = 'rfm_scores_mv'
        ) as exists
      `;

      if (viewExists[0]?.exists) {
        try {
          const rfmSegments = await prisma.$queryRaw<Array<{
            rfm_recency: number;
            rfm_frequency: number;
            rfm_monetary: number;
            count: bigint;
            customer_segment: string;
            total_revenue: number;
          }>>`
            SELECT 
              COALESCE(AVG(rfm_recency)::float, 0) as rfm_recency,
              COALESCE(AVG(rfm_frequency)::float, 0) as rfm_frequency,
              COALESCE(AVG(rfm_monetary)::float, 0) as rfm_monetary,
              COUNT(*)::bigint as count,
              COALESCE(customer_segment, 'Unknown') as customer_segment,
              COALESCE(SUM(total_spent)::float, 0) as total_revenue
            FROM rfm_scores_mv
            WHERE client_id = ${clientId}
            GROUP BY customer_segment, 
                     FLOOR(COALESCE(rfm_recency, 0)),
                     FLOOR(COALESCE(rfm_frequency, 0)),
                     FLOOR(COALESCE(rfm_monetary, 0))
            ORDER BY total_revenue DESC
          `;

          if (rfmSegments.length > 0) {
            return rfmSegments.map(seg => ({
              recency: Math.round(seg.rfm_recency),
              frequency: Math.round(seg.rfm_frequency),
              monetary: Math.round(seg.rfm_monetary),
              count: Number(seg.count),
              label: seg.customer_segment || 'Unknown',
              revenue: seg.total_revenue
            }));
          }
        } catch (error) {
          console.warn('Materialized view query failed, using retention_logs fallback:', error);
        }
      }

      // Fallback: Query from retention_logs
      const rfmSegments = await prisma.$queryRaw<Array<{
        rfm_recency: number;
        rfm_frequency: number;
        rfm_monetary: number;
        count: bigint;
        customer_segment: string;
        total_revenue: number;
      }>>`
        SELECT 
          COALESCE(AVG(rfm_recency)::float, 0) as rfm_recency,
          COALESCE(AVG(rfm_frequency)::float, 0) as rfm_frequency,
          COALESCE(AVG(rfm_monetary)::float, 0) as rfm_monetary,
          COUNT(*)::bigint as count,
          COALESCE(customer_segment, 'Unknown') as customer_segment,
          COALESCE(SUM(total_spent)::float, 0) as total_revenue
        FROM retention_logs
        WHERE client_id = ${clientId}
          AND timestamp >= NOW() - INTERVAL '365 days'
          AND rfm_recency IS NOT NULL
          AND rfm_frequency IS NOT NULL
          AND rfm_monetary IS NOT NULL
        GROUP BY customer_segment,
                 FLOOR(COALESCE(rfm_recency, 0)),
                 FLOOR(COALESCE(rfm_frequency, 0)),
                 FLOOR(COALESCE(rfm_monetary, 0))
        ORDER BY total_revenue DESC
        LIMIT 20
      `;

      if (rfmSegments.length > 0) {
        return rfmSegments.map(seg => ({
          recency: Math.round(seg.rfm_recency),
          frequency: Math.round(seg.rfm_frequency),
          monetary: Math.round(seg.rfm_monetary),
          count: Number(seg.count),
          label: seg.customer_segment || 'Unknown',
          revenue: seg.total_revenue
        }));
      }

      // Return empty array if no data found
      return [];
    } catch (error) {
      console.error('Error fetching RFM segments:', error);
      return [];
    }
  }

  // Admin dashboard queries
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    // Get client statistics using Prisma's groupBy
    const clientStats = await prisma.retention_logs.groupBy({
      by: ['client_id'],
      _count: {
        _all: true
      },
      _sum: {
        recovered_revenue: true
      },
      where: {
        churn_score: {
          gt: 0.7
        }
      }
    });

    // Get all active clients
    const clients = await prisma.clients.findMany({
      select: {
        client_id: true,
        company_name: true,
        client_name: true,
        email: true,
        status: true,
        setup_status: true
      },
      where: {
        status: 'active'
      }
    });

    // Calculate totals
    const totalRevenueRecovered = clientStats.reduce((acc: number, stat: typeof clientStats[0]) => {
      return acc + Number(stat._sum?.recovered_revenue || 0);
    }, 0);

    const highRiskCustomers = clientStats.reduce((acc: number, stat: typeof clientStats[0]) => {
      return acc + (stat._count?._all || 0);
    }, 0);

    // Map client performance data
    const clientPerformance = clients.map((client: typeof clients[0]) => {
      const stats = clientStats.find((stat: typeof clientStats[0]) => stat.client_id === client.client_id);
      return {
        clientId: client.client_id,
        companyName: client.company_name || client.client_name,
        status: client.status,
        setupStatus: client.setup_status,
        totalActions: stats?._count?._all || 0,
        recoveredRevenue: Number(stats?._sum?.recovered_revenue || 0),
        highRiskCustomers: stats?._count?._all || 0
      };
    });

    // Get recent activity
    const recentActivity = await prisma.retention_logs.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        client: {
          select: {
            company_name: true,
            client_name: true
          }
        }
      }
    });

    // Transform recent activity
    const transformedActivity = recentActivity.map((activity: typeof recentActivity[0]) => ({
      id: activity.id,
      clientName: activity.client.company_name || activity.client.client_name,
      customerId: activity.customer_id,
      action: activity.action,
      timestamp: activity.timestamp,
      status: activity.status,
      churnScore: activity.churn_score
    }));

    // Count active campaigns
    const activeCampaigns = await prisma.retention_logs.groupBy({
      by: ['campaign_variant'],
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        campaign_variant: {
          not: null
        }
      },
      _count: {
        _all: true
      }
    });

    return {
      totalClients: clients.length,
      activeCampaigns: activeCampaigns.length,
      totalRevenueRecovered,
      highRiskCustomers,
      clientPerformance,
      recentActivity: transformedActivity
    };
  }
}

// Singleton instance
export const dashboardRepository = new DashboardRepository();
