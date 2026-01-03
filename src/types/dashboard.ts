// src/types/dashboard.ts

export interface RFMSegment {
  recency: number;
  frequency: number;
  monetary: number;
  count: number;
  label: string;
  revenue: number;
  aiImpact?: string;
}

export interface AIEvent {
  id: number;
  timestamp: string;
  description: string;
  type: 'revenue' | 'churn' | 'message' | 'followup' | 'pattern';
  icon: string;
  financialImpact: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  riskScore: number;
  lastPurchase: string;
  lifetimeValue: number;
  segment: string;
  aiEvents?: Array<{
    timestamp: string;
    description: string;
    type: 'message' | 'followup' | 'purchase' | 'recovery' | 'other';
    financialImpact?: string;
  }>;
}

export interface Campaign {
  name: string;
  sent: number;
  opened: number;
  orders: number;
  revenue: number;
  roi: number;
}

export interface CohortData {
  month: string;
  cohort1: number;
  cohort2: number;
  cohort3: number;
  cohort4: number;
  cohort5: number;
}

export interface DashboardData {
  roi?: {
    recoveredLast30Days: number;
    projectedNext30Days: number;
    totalAtRiskRevenue: number;
  };
  heroMetrics?: {
    repeatPurchaseRate: number;
    clvTrend: string;
  };
  actionSummary?: {
    customersSaved: number;
    customersAtRisk: number;
    customersPredictedToChurn: number;
  };
  system?: {
    lastSync: string;
    aiStatus: string;
    cacheHit: boolean;
  };
  rfmSegments?: RFMSegment[];
  aiImpactFeed?: AIEvent[];
  customers?: Customer[];
  campaigns?: Campaign[];
  cohortData?: CohortData[];
  cacheHit?: boolean;
  servedFrom?: string;
  timestamp?: string;
}