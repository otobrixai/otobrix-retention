// sentry.client.config.ts - Updated with DoS protection
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // DoS protection: Reduced sample rates
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.5,
    
    // Session replay with lower sample rate
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.5,
    replaysOnErrorSampleRate: 1.0,
    
    // Performance monitoring with limits
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filter out health check and monitoring endpoints
    beforeSend(event, _hint) {
      // Filter out health check errors
      if (event.request?.url?.includes('/api/health')) {
        return null;
      }
      
      // Filter out monitoring endpoints
      if (event.request?.url?.includes('/api/metrics')) {
        return null;
      }
      
      // Filter out static assets
      if (event.request?.url?.includes('/_next/static')) {
        return null;
      }
      
      // Add security context
      event.tags = {
        ...event.tags,
        environment: process.env.NODE_ENV,
        runtime: 'browser',
        security_level: 'high',
      };
      
      // Remove potentially sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      
      return event;
    },
    
    // Rate limiting for Sentry itself
    maxBreadcrumbs: 30,
    
    // Enable debug mode only in development
    debug: process.env.NODE_ENV === 'development',
    
    // Disable Sentry locally unless explicitly enabled
    enabled: process.env.NODE_ENV !== 'development' || process.env.ENABLE_SENTRY_LOCAL === 'true',
    
    // Prevent file descriptor leaks (browser transport doesn't support maxQueueSize)
    transportOptions: {
      keepAlive: false,
    },
    
    // Security: Ignore specific errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });
  
  console.warn('✅ Sentry client-side monitoring initialized with enhanced DoS protection');
} else {
  console.warn('⚠️ Sentry DSN not configured - client-side error tracking disabled');
}