// scripts/test-dashboard-api.ts
import { getPremiumDashboardData } from '../src/lib/actions/premium-dashboard';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

async function main() {
  const clientId = 'cml7ov8cy0000uolcblfkw0va';
  console.info(`🧪 Testing getPremiumDashboardData for client: ${clientId}...`);
  
  try {
    const snapshot = await getPremiumDashboardData(clientId);
    console.info('✅ Snapshot generated:');
    console.info('Analytics:', JSON.stringify(snapshot.analytics, null, 2));
    console.info('Recent Actions count:', snapshot.recentActions.length);
    console.info('Segments count:', snapshot.customerSegments.length);
    console.info('Cache Source:', snapshot.cacheSource);
    console.info('Computation Mode:', snapshot.computationMode);

    // Test the mapping logic from route.ts
    const analytics = snapshot.analytics;
    const dashboardData = {
      roi: {
        recoveredLast30Days: Math.round(analytics.totalRevenue * 0.12),
        projectedNext30Days: Math.round(analytics.totalRevenue * 0.15),
        totalAtRiskRevenue: Math.round(analytics.totalRevenue * 0.28)
      }
    };
    console.info('Mapped ROI:', JSON.stringify(dashboardData.roi, null, 2));

  } catch (error) {
    console.error('❌ Service failed:', error);
  }
  process.exit(0);
}

main();
