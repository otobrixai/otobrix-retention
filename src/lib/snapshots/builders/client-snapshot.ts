// src/lib/snapshots/builders/client-snapshot.ts

import { prisma } from '@/lib/prisma';

export async function buildClientSnapshot(clientId: string) {
  const stats = await prisma.retention_logs.aggregate({
    where: { client_id: clientId },
    _count: { id: true },
    _sum: { recovered_revenue: true },
  });

  return {
    clientId,
    activityCount: stats._count.id,
    recoveredRevenue: Number(stats._sum.recovered_revenue || 0),
    generatedAt: new Date().toISOString(),
  };
}
