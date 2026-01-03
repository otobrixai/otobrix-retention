// sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Lower sample rate for edge functions
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
    
    // Filter out health check endpoints
    beforeSend(event, _hint) {
      // Skip health endpoints
      if (event.request?.url?.includes('/api/health')) {
        return null;
      }
      
      // Add environment tag
      event.tags = {
        ...event.tags,
        environment: process.env.NODE_ENV,
        runtime: 'edge',
        region: process.env.VERCEL_REGION || 'local',
      };
      
      return event;
    },
    
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Disable Sentry locally unless explicitly enabled
    enabled: process.env.NODE_ENV !== 'development' || process.env.ENABLE_SENTRY_LOCAL === 'true',
  });
  
  console.warn('✅ Sentry edge monitoring initialized');
} else {
  console.warn('⚠️ Sentry DSN not configured - edge error tracking disabled');
}