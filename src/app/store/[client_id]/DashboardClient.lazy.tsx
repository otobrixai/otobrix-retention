// src/app/store/[client_id]/DashboardClient.lazy.tsx - UPDATED
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';

// Lazy load heavy chart components
export const CohortRetentionChart = dynamic(
  () => import('./components/CohortRetentionChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

export const RFMHeatmapInteractive = dynamic(
  () => import('./components/RFMHeatmapInteractive'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

export const AtRiskLeaderboard = dynamic(
  () => import('./components/AtRiskLeaderboard'),
  {
    loading: () => <TableSkeleton />
  }
);

export const RecoveryROITracker = dynamic(
  () => import('./components/RecoveryROITracker'),
  {
    loading: () => <TableSkeleton />
  }
);

// New AI Impact Feed component
export const AIImpactFeed = dynamic(
  () => import('./components/AIImpactFeed'),
  {
    loading: () => <CardSkeleton />
  }
);

// Skeleton Components
export const ChartSkeleton = () => (
  <Card className="bg-slate-800/50 border-slate-700/50 p-6 animate-pulse">
    <div className="h-6 w-48 bg-slate-700 rounded-lg mb-6"></div>
    <div className="h-80 bg-slate-700 rounded-2xl"></div>
  </Card>
);

export const TableSkeleton = () => (
  <Card className="bg-slate-800/50 border-slate-700/50 p-6 animate-pulse">
    <div className="h-6 w-48 bg-slate-700 rounded-lg mb-6"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-slate-700 rounded-xl"></div>
      ))}
    </div>
  </Card>
);

export const CardSkeleton = () => (
  <Card className="bg-slate-800/50 border-slate-700/50 p-6 animate-pulse">
    <div className="h-6 w-48 bg-slate-700 rounded-lg mb-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-40 bg-slate-700 rounded-lg"></div>
      ))}
    </div>
  </Card>
);