// src/lib/cache/warmup.ts

import { prisma } from '@/lib/prisma';
import { cacheManager } from '@/lib/cache/redis';

export async function warmupSnapshots() {
  const latestSnapshots = await prisma.dashboardSnapshot.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  for (const snap of latestSnapshots) {
    let key: string;

    if (snap.type === 'admin') {
      key = 'snapshot:admin:current';
    } else if (snap.subjectId) {
      key = `snapshot:${snap.type}:${snap.subjectId}`;
    } else {
      continue;
    }

    await cacheManager.set(key, snap.id);
  }
}
