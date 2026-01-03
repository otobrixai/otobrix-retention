// src/domain/dashboard/dashboard.service.ts - FIXED ADAPTER
import { dashboardRepository } from './dashboard.repository';
import { getPremiumDashboardData as getLegacyPremiumDashboardData } from '@/lib/actions/premium-dashboard';
import { DashboardError } from './dashboard.types';

// Import the types from the repository
import type {
  DashboardData,
  ClientInfo,
  Analytics,
  RecentAction,
  CustomerSegment
} from './dashboard.repository';

// Import the pure snapshot type
import type { DashboardSnapshot } from '@/lib/actions/premium-dashboard';

export class DashboardService {
  // Adapter function: converts pure snapshot to legacy UI format
  private snapshotToDashboardData(snapshot: DashboardSnapshot): DashboardData {
    return {
      client: snapshot.client,
      
      // Analytics enrichment: add totalActions from recentActions count
      analytics: {
        ...snapshot.analytics,
        totalActions: snapshot.recentActions.length // Required by DashboardData contract
      },
      
      recentActions: snapshot.recentActions,
      customerSegments: snapshot.customerSegments,
      
      // Legacy/decorated fields for UI compatibility
      source: snapshot.computationMode === 'precise' 
        ? 'materialized_view' 
        : 'fallback_aggregation',
      cacheHit: 'service_layer', // Indicates this came through service layer
      lastUpdated: snapshot.computedAt
    };
  }

  // Wrapper for backward compatibility with existing code
  async getPremiumDashboardData(clientId: string): Promise<DashboardData> {
    try {
      // Get the pure snapshot
      const snapshot = await getLegacyPremiumDashboardData(clientId);
      
      // Adapt to legacy DashboardData format
      return this.snapshotToDashboardData(snapshot);
    } catch (error) {
      console.error('DashboardService.getPremiumDashboardData failed:', error);
      throw new DashboardError(
        error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        'DASHBOARD_FETCH_FAILED',
        500
      );
    }
  }

  async getAdminDashboard() {
    try {
      return await dashboardRepository.getAdminDashboardStats();
    } catch (error) {
      console.error('DashboardService.getAdminDashboard failed:', error);
      throw new DashboardError(
        error instanceof Error ? error.message : 'Failed to fetch admin dashboard data',
        'ADMIN_DASHBOARD_FETCH_FAILED',
        500
      );
    }
  }

  async getClientAnalytics(clientId: string): Promise<{
    client: ClientInfo;
    analytics: Analytics;
    recentActions: RecentAction[];
    customerSegments: CustomerSegment[];
  }> {
    try {
      const [client, stats, recentActions, rfmSegments] = await Promise.all([
        dashboardRepository.getClientInfo(clientId),
        dashboardRepository.getClientStats(clientId),
        dashboardRepository.getRecentActions(clientId),
        dashboardRepository.getRFMSegments(clientId)
      ]);

      // Convert RFMSegments to CustomerSegments
      const customerSegments: CustomerSegment[] = rfmSegments.map(segment => ({
        segment: segment.label,
        count: segment.count
      }));

      return {
        client,
        analytics: {
          totalCustomers: stats.high_risk_customers * 4, // Simplified calculation
          highRiskCustomers: stats.high_risk_customers,
          recoveryRate: Math.min(100, (stats.recovered_revenue / 10000) * 100), // Simplified
          totalActions: stats.total_actions,
          totalRevenue: stats.recovered_revenue,
          highValueCustomers: Math.floor(stats.high_risk_customers * 0.25)
        },
        recentActions,
        customerSegments
      };
    } catch (error) {
      console.error('DashboardService.getClientAnalytics failed:', error);
      throw error; // Re-throw for controller to handle
    }
  }
}

// Singleton instance
export const dashboardService = new DashboardService();