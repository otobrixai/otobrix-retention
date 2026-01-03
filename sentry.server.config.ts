// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Adjust sample rate in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Performance monitoring - simplified for server
    integrations: [
      Sentry.httpIntegration(),
    ],
    
    // Filter out monitoring and health endpoints
    beforeSend(event, hint) {
      const requestUrl = event.request?.url;
      
      // Skip health and monitoring endpoints
      if (requestUrl?.includes('/api/health') || 
          requestUrl?.includes('/api/metrics') ||
          requestUrl?.includes('/api/csrf-token')) {
        return null;
      }
      
      // Skip rate limit errors (they're expected)
      if (event.tags?.['http.status_code'] === '429') {
        return null;
      }
      
      // Add environment and runtime info
      event.tags = {
        ...event.tags,
        environment: process.env.NODE_ENV,
        runtime: 'server',
        region: process.env.VERCEL_REGION || 'local',
      };
      
      // Add request ID if available
      if (hint) {
        // Type-safe extraction of request ID
        const requestId = extractRequestIdFromHint(hint);
        if (requestId) {
          event.tags = {
            ...event.tags,
            request_id: requestId,
          };
        }
      }
      
      return event;
    },
    
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Disable Sentry locally unless explicitly enabled
    enabled: process.env.NODE_ENV !== 'development' || process.env.ENABLE_SENTRY_LOCAL === 'true',
    
    // Ignore certain errors
    ignoreErrors: [
      'CSRF token validation failed',
      'Rate limit exceeded',
      'Unauthorized',
      'Session expired',
    ],
  });
  
  console.warn('✅ Sentry server-side monitoring initialized');
} else {
  console.warn('⚠️ Sentry DSN not configured - server-side error tracking disabled');
}

// Helper function to extract request ID from hint
function extractRequestIdFromHint(hint: unknown): string | undefined {
  try {
    if (hint && typeof hint === 'object') {
      const hintObj = hint as Record<string, unknown>;
      
      // Try event_id first
      if (typeof hintObj.event_id === 'string') {
        return hintObj.event_id;
      }
      
      // Then check request headers
      if (hintObj.request && typeof hintObj.request === 'object') {
        const requestObj = hintObj.request as Record<string, unknown>;
        if (requestObj.headers && typeof requestObj.headers === 'object') {
          const headers = requestObj.headers as Record<string, unknown>;
          const requestId = headers['x-request-id'];
          if (typeof requestId === 'string') {
            return requestId;
          }
        }
      }
    }
  } catch (_error) {
    // Silently fail - this is just for adding metadata
  }
  
  return undefined;
}