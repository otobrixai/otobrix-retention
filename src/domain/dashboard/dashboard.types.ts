// src/domain/dashboard/dashboard.types.ts

// Repository output types
export interface ClientStats {
  client_id: string;
  total_actions: number;
  recovered_revenue: number;
  high_risk_customers: number;
}

export interface RFMSegment {
  recency: number;
  frequency: number;
  monetary: number;
  count: number;
  label: string;
  revenue: number;
}

export interface AdminDashboardStats {
  totalClients: number;
  activeCampaigns: number;
  totalRevenueRecovered: number;
  highRiskCustomers: number;
  clientPerformance: Array<{
    clientId: string;
    companyName: string | null;
    status: string | null;
    setupStatus: string | null;
    totalActions: number;
    recoveredRevenue: number;
    highRiskCustomers: number;
  }>;
  recentActivity: Array<{
    id: string;
    clientName: string | null;
    customerId: string;
    action: string | null;
    timestamp: Date;
    status: string | null;
    churnScore: number | null;
  }>;
}

// Service input/output types
export interface GetPremiumDashboardParams {
  clientId: string;
}

export interface GetAdminDashboardParams {
  // Optional filters for admin dashboard
  timeRange?: '7d' | '30d' | '90d';
}

// Error types
export class DashboardError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'DASHBOARD_ERROR',
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'DashboardError';
  }
}

export class ClientNotFoundError extends DashboardError {
  constructor(clientId: string) {
    super(`Client not found: ${clientId}`, 'CLIENT_NOT_FOUND', 404);
  }
}