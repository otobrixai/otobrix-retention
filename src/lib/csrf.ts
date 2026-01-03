// src/lib/csrf.ts - UPDATED WITH PROPER CONSOLE USAGE
import { cookies } from 'next/headers';

// Create server-only helper if it doesn't exist
const serverOnly = () => {
  if (typeof window !== 'undefined') {
    throw new Error('This code can only run on the server');
  }
};

// Helper for development-only logging
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[CSRF DEV]', ...args);
  }
};

// Generate a cryptographically secure CSRF token
export async function generateCSRFToken(): Promise<string> {
  serverOnly();
  
  // Use crypto.randomBytes for better entropy in production
  const tokenBuffer = new Uint8Array(32);
  crypto.getRandomValues(tokenBuffer);
  const token = Array.from(tokenBuffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const cookieStore = await cookies();
  
  // Set HTTP-only cookie (inaccessible to JavaScript)
  cookieStore.set('_csrf', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 60, // 30 minutes
    path: '/',
  });
  
  devLog('Generated new CSRF token');
  return token;
}

// Get existing CSRF token (for pages/components)
export async function getCSRFToken(): Promise<string> {
  serverOnly();
  
  const cookieStore = await cookies();
  const existingToken = cookieStore.get('_csrf')?.value;
  
  if (existingToken) {
    return existingToken;
  }
  
  // If no token exists, generate a new one
  return await generateCSRFToken();
}

// Validate CSRF token with strict enforcement in production
export async function validateCSRFToken(token: string | null): Promise<boolean> {
  serverOnly();
  
  // REMOVED: DISABLE_CSRF bypass flag
  // CSRF protection is always enabled in production
  if (process.env.NODE_ENV !== 'production') {
    // In development, we can be more permissive for testing
    // but still validate if token is provided
    if (!token) {
      console.warn('[CSRF] Warning: No CSRF token provided in development');
      return true; // Allow in dev for easier testing
    }
  }
  
  // In production, strict validation
  if (!token || token.length !== 64) { // 32 bytes = 64 hex chars
    console.error('[CSRF] Invalid token format or missing token');
    return false;
  }
  
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('_csrf')?.value;
  
  if (!storedToken) {
    console.error('[CSRF] No CSRF token found in cookies');
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  const isValid = constantTimeCompare(token, storedToken);
  
  if (!isValid) {
    console.error('[CSRF] Token mismatch');
  }
  
  return isValid;
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

export async function validateOrigin(request: Request): Promise<boolean> {
  serverOnly();
  
  // REMOVED: DISABLE_CSRF bypass flag
  // Origin validation is always enabled
  
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // If no app URL configured, we can't validate origin
  // In production, this should be configured
  if (!appUrl) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CSRF] NEXT_PUBLIC_APP_URL not configured in production');
      return false;
    }
    console.warn('[CSRF] NEXT_PUBLIC_APP_URL not configured, skipping origin validation');
    return true; // Allow in development
  }
  
  const expectedHost = new URL(appUrl).host;
  
  // Check origin header first (for CORS requests)
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === expectedHost;
    } catch {
      console.error('[CSRF] Invalid origin URL:', origin);
      return false;
    }
  }
  
  // Fall back to referer header (for same-origin requests)
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost === expectedHost;
    } catch {
      console.error('[CSRF] Invalid referer URL:', referer);
      return false;
    }
  }
  
  // If neither origin nor referer is present, this might be a direct API call
  // We'll be strict in production, more permissive in development
  if (process.env.NODE_ENV === 'production') {
    console.error('[CSRF] Missing both origin and referer headers in production');
    return false;
  }
  
  console.warn('[CSRF] Missing origin and referer headers in development');
  return true;
}

export async function withCSRFProtection(request: Request, handler: () => Promise<Response>): Promise<Response> {
  serverOnly();
  
  // Apply CSRF protection to all state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    devLog(`Validating ${request.method} request to ${request.url}`);
    
    // Validate origin first (defense in depth)
    const originValid = await validateOrigin(request);
    if (!originValid) {
      console.error('[CSRF] Origin validation failed');
      return new Response(JSON.stringify({ 
        error: 'Forbidden: Origin validation failed',
        code: 'CSRF_ORIGIN_INVALID'
      }), { 
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Validation': 'failed-origin'
        }
      });
    }
    
    // Validate CSRF token
    const csrfToken = request.headers.get('x-csrf-token');
    const csrfValid = await validateCSRFToken(csrfToken);
    
    if (!csrfValid) {
      console.error('[CSRF] Token validation failed');
      return new Response(JSON.stringify({ 
        error: 'Forbidden: CSRF token validation failed',
        code: 'CSRF_TOKEN_INVALID'
      }), { 
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Validation': 'failed-token'
        }
      });
    }
    
    devLog('CSRF validation passed');
  }
  
  return handler();
}

// Export serverOnly for use in other files if needed
export { serverOnly };