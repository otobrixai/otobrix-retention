// Fix the rate-limit.ts file
import { NextRequest } from 'next/server';
import { cacheManager } from '@/lib/cache/redis';

// Rate limit configuration - export it to avoid unused warning
export const RATE_LIMIT_CONFIG = {
  // General API limits
  API: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  },
  // Auth endpoints
  AUTH: {
    maxRequests: 10,
    windowMs: 600000, // 10 minutes
  },
  // Login attempts
  LOGIN: {
    maxRequests: 5,
    windowMs: 900000, // 15 minutes
  },
  // Password reset
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
  },
  // Admin endpoints (stricter limits)
  ADMIN: {
    maxRequests: 30, // Stricter limit for admin endpoints
    windowMs: 60000, // 1 minute window
  },
};

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// Fix the checkRateLimit function signature and implementation
export async function checkRateLimit(
  request: NextRequest,
  _type: 'API' | 'AUTH' | 'LOGIN' | 'PASSWORD_RESET' | 'ADMIN' = 'API',
  _identifier?: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Skip rate limiting for admin API keys
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey && adminKey === process.env.ADMIN_API_KEY) {
    return { 
      allowed: true, 
      remaining: RATE_LIMIT_CONFIG.API.maxRequests, 
      resetTime: Date.now() 
    };
  }

  // Generate rate limit key
  let rateLimitKey: string;

  if (_identifier) {
    rateLimitKey = `rate_limit:${_type}:${_identifier}`;
  } else {
    // Use IP-based key
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIP || 'unknown';
    rateLimitKey = `rate_limit:${_type}:ip:${ip}`;
  }

  const config = RATE_LIMIT_CONFIG[_type];
  const now = Date.now();

  try {
    // Get current rate limit info from cache
    const currentInfo = await cacheManager.get<RateLimitInfo>(rateLimitKey);

    let count: number;
    let resetTime: number;

    if (currentInfo && currentInfo.resetTime > now) {
      // Existing window
      count = currentInfo.count + 1;
      resetTime = currentInfo.resetTime;
    } else {
      // New window or expired window
      count = 1;
      resetTime = now + config.windowMs;
    }

    // Update cache
    const newInfo: RateLimitInfo = {
      count,
      resetTime,
    };

    await cacheManager.set(rateLimitKey, newInfo, Math.ceil(config.windowMs / 1000));

    const remaining = Math.max(0, config.maxRequests - count);
    const allowed = count <= config.maxRequests;

    // Log rate limit activity for monitoring (only when approaching limits)
    if (count > config.maxRequests * 0.8) {
      console.warn(`[RATE LIMIT] Warning: ${rateLimitKey} at ${count}/${config.maxRequests} requests`);
    }

    if (!allowed) {
      console.warn(`[RATE LIMIT] Exceeded: ${rateLimitKey}`);
    }

    return { 
      allowed, 
      remaining, 
      resetTime 
    };

  } catch (error) {
    // If cache fails, allow the request (fail open)
    console.error('[RATE LIMIT] Cache error, failing open:', error);
    return { 
      allowed: true, 
      remaining: config.maxRequests, 
      resetTime: now 
    };
  }
}

// Fix getRateLimitHeaders function to accept type parameter
export function getRateLimitHeaders(remaining: number, resetTime: number, type: keyof typeof RATE_LIMIT_CONFIG = 'API') {
  const config = RATE_LIMIT_CONFIG[type];
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString(),
  };
}

// Helper to get client IP for auth endpoints
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || 'unknown';
}

// Function to get rate limit stats
export async function getRateLimitStats() {
  try {
    const cacheStats = await cacheManager.getStats();
    
    return {
      connected: cacheStats.connected,
      config: RATE_LIMIT_CONFIG,
      cacheInfo: {
        keyCount: cacheStats.keyCount || 0,
        itemCount: cacheStats.itemCount || 0,
        maxSize: cacheStats.max || 0
      },
      note: 'Rate limit stats are aggregated from active rate limit keys',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[RATE LIMIT] Failed to get rate limit stats:', error);
    return {
      connected: false,
      config: RATE_LIMIT_CONFIG,
      cacheInfo: {
        keyCount: 0,
        itemCount: 0,
        maxSize: 0
      },
      error: 'Failed to fetch rate limit stats',
      timestamp: new Date().toISOString()
    };
  }
}