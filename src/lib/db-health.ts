// src/lib/db-health.ts
import { prisma } from '@/lib/prisma';

let isConnected = false;
let lastCheck = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function checkDatabaseHealth() {
  const now = Date.now();
  
  // Use cached result if recent
  if (isConnected && (now - lastCheck) < CACHE_TTL) {
    return { healthy: true, cached: true, timestamp: new Date(lastCheck).toISOString() };
  }

  try {
    // Try a simple query to check connection
    await prisma.$queryRawUnsafe('SELECT 1');
    
    isConnected = true;
    lastCheck = now;
    
    return { 
      healthy: true, 
      cached: false, 
      timestamp: new Date().toISOString(),
      message: 'Database connection is healthy'
    };
  } catch (error: unknown) {
    isConnected = false;
    lastCheck = now;
    
    const errorMessage = error instanceof Error ? error.message : 'Database connection failed';
    const errorCode = error instanceof Error && 'code' in error ? (error as Record<string, unknown>).code : undefined;
    
    return { 
      healthy: false, 
      cached: false, 
      timestamp: new Date().toISOString(),
      error: errorMessage,
      code: errorCode
    };
  }
}

export function getDatabaseStatus() {
  return {
    connected: isConnected,
    lastCheck: new Date(lastCheck).toISOString(),
    age: lastCheck ? Date.now() - lastCheck : null
  };
}
