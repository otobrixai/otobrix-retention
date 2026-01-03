// src/lib/snapshots/builders/admin-snapshot.ts

import { prisma } from '@/lib/prisma';

export async function buildAdminSnapshot() {
  const [clients, logs] = await prisma.$transaction([
    prisma.clients.count(),
    prisma.retention_logs.count(),
  ]);

  return {
    system: {
      totalClients: clients,
      totalEvents: logs,
      generatedAt: new Date().toISOString(),
    },
  };
}
