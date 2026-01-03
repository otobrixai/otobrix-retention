// src/lib/snapshots/snapshot-utils.ts

const SIZE_LIMITS = {
  admin: 50 * 1024,
  premium: 30 * 1024,
  client: 15 * 1024,
};

type JsonObject = Record<string, unknown>;

export function trimSnapshot(input: unknown): JsonObject {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const data: JsonObject = structuredClone(input as JsonObject);

  // Remove volatile / transport-only fields
  delete data.cacheHit;
  delete data.servedFrom;
  delete data.timestamp;

  if (Array.isArray(data.recentClients)) {
    data.recentClients = data.recentClients.slice(0, 20) // Max 20 recent clients
  }
  
  if (Array.isArray(data.aiImpactFeed)) {
    data.aiImpactFeed = data.aiImpactFeed.slice(0, 6);
  }

  if (Array.isArray(data.customers)) {
    data.customers = data.customers.slice(0, 10);
  }

  if (Array.isArray(data.notifications)) {
    data.notifications = data.notifications.slice(0, 20);
  }

  return data;
}

export function calculateSizeBytes(data: unknown): number {
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
}

export function assertSnapshotSize(
  type: keyof typeof SIZE_LIMITS,
  sizeBytes: number
) {
  const limit = SIZE_LIMITS[type];
  if (sizeBytes > limit) {
    throw new Error(
      `Snapshot too large: ${sizeBytes} bytes (limit ${limit})`
    );
  }
}
