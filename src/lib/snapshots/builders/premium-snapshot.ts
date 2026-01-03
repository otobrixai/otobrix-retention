// src/lib/snapshots/builders/premium-snapshot.ts

import { getPremiumDashboardData } from '@/lib/actions/premium-dashboard';

export async function buildPremiumSnapshot(clientId: string) {
  const data = await getPremiumDashboardData(clientId);

  return {
    ...data,
    generatedAt: new Date().toISOString(),
  };
}
