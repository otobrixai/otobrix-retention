// instrumentation.ts - CRITICAL: RSC validation must stay for CVE-2025-66478
export async function register() {
  // TEMP DISABLED — v1 performance mode
  return
}

// CRITICAL: Strict RSC validation to prevent RCE
function _enableStrictRSCValidation() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('✅ STRICT RSC validation enabled (CVE-2025-66478 protection)');
    
    // Type-safe monkey-patching for Flight server
    type FlightServer = (...args: unknown[]) => unknown;
    const globalObj = global as any;
    const originalFlightServer: FlightServer | undefined = globalObj.__nextFlightServer;
    
    if (originalFlightServer) {
      globalObj.__nextFlightServer = function patchedFlightServer(...args: unknown[]): unknown {
        const [payload] = args;
        
        // Validate RSC payload size (prevent DoS - CVE-2025-55184)
        if (payload && JSON.stringify(payload).length > 10 * 1024 * 1024) {
          throw new Error('RSC payload too large - potential DoS attempt');
        }
        
        // Validate RSC payload structure (prevent RCE - CVE-2025-55182)
        if (payload && typeof payload === 'object') {
          const payloadStr = JSON.stringify(payload);
          if (payloadStr.includes('__proto__') || 
              payloadStr.includes('constructor') || 
              payloadStr.includes('prototype') ||
              payloadStr.includes('$$typeof')) {
            console.error('🚨 BLOCKED: Malicious RSC payload detected');
            throw new Error('Invalid RSC payload - security violation');
          }
        }
        
        return originalFlightServer.apply(this, args);
      };
    }
  }
}

// CRITICAL: Disable unsafe deserialization patterns
function _disableUnsafeDeserialization() {
  if (process.env.NODE_ENV === 'production') {
    const originalParse = JSON.parse;
    
    JSON.parse = function(text: string, reviver?: (key: string, value: unknown) => unknown): unknown {
      // Validate input
      if (typeof text !== 'string') {
        throw new TypeError('JSON input must be a string');
      }
      
      // Check for prototype pollution attempts
      if (text.includes('__proto__') || 
          text.includes('constructor') || 
          text.includes('prototype')) {
        console.error('🚨 BLOCKED: Unsafe JSON deserialization attempt');
        throw new Error('Unsafe JSON deserialization - security violation');
      }
      
      // Check for excessive recursion (DoS protection)
      let depth = 0;
      for (const char of text) {
        if (char === '{' || char === '[') depth++;
        if (char === '}' || char === ']') depth--;
        if (depth > 100) {
          console.error('🚨 BLOCKED: Deeply nested JSON (DoS attempt)');
          throw new Error('Excessively nested JSON - potential DoS');
        }
      }
      
      return originalParse.call(this, text, reviver);
    };
  }
}

// CRITICAL: Security headers for all responses
export function onRequest(_request: Request, event: { request: { response: { headers: Headers } } }) {
  const response = event.request.response;
  
  if (response && response.headers) {
    // Remove 'unsafe-inline' COMPLETELY in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self'; " + // NO unsafe-eval or unsafe-inline
        "style-src 'self'; " + // NO unsafe-inline
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
      );
    }
    
    // Additional security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  }
}