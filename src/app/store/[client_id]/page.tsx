// src/app/store/[client_id]/page.tsx - FIXED
import { requireStore } from '@/lib/server-auth';
import { dashboardService } from '@/domain/dashboard/dashboard.service';
import DashboardClient from './DashboardClient';
import { ClientNotFoundError } from '@/domain/dashboard/dashboard.types';

type Props = {
  params: Promise<{ client_id: string }>;
};

export default async function StoreDashboard(props: Props) {
  const { client_id } = await props.params;
  
  try {
    // Verify user has access to this store
    const { client } = await requireStore(client_id);
    
    // Get initial dashboard data through service layer (prefixed with underscore since not used directly)
    const _initialDashboardData = await dashboardService.getPremiumDashboardData(client_id);
    
    // Combine all data with proper types
    const initialData = {
      clientId: client_id,
      client: {
        client_name: client.client_name || 'Client',
        company_name: client.company_name || 'Company'
      }
    };
    
    return <DashboardClient initialData={initialData} />;
    
  } catch (error) {
    console.error('StoreDashboard error:', error);
    
    if (error instanceof ClientNotFoundError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
            <p className="text-slate-400">The requested store dashboard does not exist or you don't have access.</p>
          </div>
        </div>
      );
    }
    
    // Return error fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard Error</h1>
          <p className="text-slate-400">Failed to load dashboard data. Please try again later.</p>
        </div>
      </div>
    );
  }
}
