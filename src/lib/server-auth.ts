// src/lib/server-auth.ts
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

// Session expiration configuration
const SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer

// Define session types to fix TypeScript errors
interface AuthSession {
  user?: {
    id: string;
    name?: string;
    email?: string;
    type: 'admin' | 'client';
    role: string;
    clientId?: string;
    clientName?: string;
    branding?: {
      primary_color: string;
      logo_url: string;
      company_name: string;
    };
  };
  expires?: string;
}

// Helper to check if session is valid and not expired (STRICT ENFORCEMENT)
export async function getValidatedSession() {
  try {
    const session = await auth() as AuthSession;
    
    if (!session) {
      console.warn('[AUTH] No session found');
      return null;
    }
    
    // === STRICT EXPIRATION ENFORCEMENT ===
    let expiresAt: number | null = null;
    
    // Handle session expiration from NextAuth.js
    if (session.expires) {
      // NextAuth.js standard format
      expiresAt = new Date(session.expires).getTime();
    }
    
    const now = Date.now();
    
    if (expiresAt) {
      // Check if session is already expired
      if (expiresAt <= now) {
        console.warn('[AUTH] Session expired');
        return null;
      }
      
      // Check if session expires within buffer time
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < SESSION_EXPIRY_BUFFER) {
        console.warn(`[AUTH] Session expires soon (${Math.round(timeUntilExpiry / 1000)}s)`);
        return null;
      }
    } else {
      // No expiration timestamp - apply default policy
      console.warn('[AUTH] Session has no expiration timestamp');
      
      // In production, reject sessions without expiration
      if (process.env.NODE_ENV === 'production') {
        console.error('[AUTH] Rejecting session without expiration in production');
        return null;
      }
    }
    
    // Validate user object structure
    if (!session.user || typeof session.user !== 'object') {
      console.error('[AUTH] Invalid user object in session');
      return null;
    }
    
    // Log successful validation (use warn for allowed console methods)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[AUTH] Valid session for user: ${session.user.email || session.user.id}`);
    }
    
    return session;
  } catch (error) {
    console.error('[AUTH] Error validating session:', error);
    return null;
  }
}

// Enhanced requireAdmin with strict session validation
export async function requireAdmin() {
  try {
    const session = await getValidatedSession();
    
    if (!session?.user) {
      console.warn('[AUTH] No valid session for admin access');
      redirect(`/${process.env.ADMIN_LOGIN_PATH_SEGMENT || 'login'}?error=session_expired`);
    }
    
    if (session.user.type !== 'admin') {
      console.warn(`[AUTH] Non-admin user attempted admin access: ${session.user.type}`);
      redirect(`/${process.env.ADMIN_LOGIN_PATH_SEGMENT || 'login'}?error=unauthorized`);
    }
    
    // Additional admin-specific validation
    if (process.env.ADMIN_EMAIL_WHITELIST) {
      const whitelist = process.env.ADMIN_EMAIL_WHITELIST.split(',');
      if (!whitelist.includes(session.user.email || '')) {
        console.error(`[AUTH] Admin email not in whitelist: ${session.user.email}`);
        redirect(`/${process.env.ADMIN_LOGIN_PATH_SEGMENT || 'login'}?error=unauthorized`);
      }
    }
    
    return session;
  } catch (error) {
    console.error('[AUTH] Error in requireAdmin:', error);
    redirect(`/${process.env.ADMIN_LOGIN_PATH_SEGMENT || 'login'}?error=auth_error`);
  }
}

// Enhanced requireClient with strict validation
export async function requireClient(clientId: string) {
  try {
    // Validate clientId format first
    if (!clientId || !clientId.match(/^[a-zA-Z0-9_-]{1,100}$/)) {
      console.error('[AUTH] Invalid clientId format');
      redirect('/?error=invalid_client');
    }
    
    const session = await getValidatedSession();
    
    if (!session?.user) {
      console.warn('[AUTH] No valid session for client access');
      redirect('/?error=session_expired');
    }
    
    if (session.user.type !== 'client') {
      console.warn(`[AUTH] Non-client user attempted client access: ${session.user.type}`);
      redirect('/?error=unauthorized');
    }
    
    if (session.user.clientId !== clientId) {
      console.warn(`[AUTH] Client ID mismatch: expected ${clientId}, got ${session.user.clientId}`);
      redirect('/?error=client_mismatch');
    }
    
    // Verify client exists and is active
    const clientExists = await prisma.clients.findUnique({
      where: { 
        client_id: clientId,
        status: 'active'
      },
      select: { client_id: true }
    });
    
    if (!clientExists) {
      console.error(`[AUTH] Client not found or inactive: ${clientId}`);
      redirect('/?error=client_not_found');
    }
    
    return session;
  } catch (error) {
    console.error('[AUTH] Error in requireClient:', error);
    redirect('/?error=auth_error');
  }
}

// Session freshness check for sensitive operations (e.g., password change)
export async function checkSessionFreshness(maxAgeMinutes: number = 5): Promise<boolean> {
  try {
    const session = await getValidatedSession();
    
    if (!session) {
      return false;
    }
    
    // Since we don't have createdAt in session, we'll use the expiration time
    // to estimate session freshness
    if (session.expires) {
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const sessionDuration = (30 * 60 * 1000) - timeUntilExpiry; // Assuming 30 min sessions
      const maxAgeMs = maxAgeMinutes * 60 * 1000;
      
      return sessionDuration <= maxAgeMs;
    }
    
    // If no expiration timestamp, we can't check freshness
    console.warn('[AUTH] Cannot check session freshness - no expiration timestamp');
    return false;
  } catch (error) {
    console.error('[AUTH] Error checking session freshness:', error);
    return false;
  }
}

// Get client details from client_id with enhanced security checks
export async function getClientFromId(clientId: string) {
  try {
    // Strict input validation
    if (!clientId || typeof clientId !== 'string' || !clientId.match(/^[a-zA-Z0-9_-]{1,100}$/)) {
      console.error('[AUTH] Invalid clientId format');
      return null;
    }
    
    const client = await prisma.clients.findUnique({
      where: { 
        client_id: clientId,
        status: 'active'
      },
      select: {
        client_id: true,
        client_name: true,
        company_name: true,
        email: true,
        status: true,
        created_at: true
      }
    });

    // Log access for auditing
    if (client && process.env.NODE_ENV === 'production') {
      console.warn(`[AUTH] Client details accessed: ${clientId}`);
    }

    return client;
  } catch (error) {
    console.error('[AUTH] Error fetching client:', error);
    return null;
  }
}

// Store authentication helper with enhanced security
export async function requireStore(clientId: string): Promise<{
  session: AuthSession;
  client: { client_id: string; client_name: string; company_name: string | null }
}> {
  try {
    // Strict clientId validation
    if (!clientId || !clientId.match(/^[a-zA-Z0-9_-]{1,100}$/)) {
      console.error('[AUTH] Invalid clientId in requireStore');
      redirect('/?error=invalid_client');
    }

    // Get validated session (with strict expiration check)
    const session = await getValidatedSession();
    if (!session?.user) {
      console.warn('[AUTH] No valid session for store access');
      redirect('/?error=session_expired');
    }

    // Check user type
    if (session.user.type !== 'client') {
      console.warn(`[AUTH] Non-client user attempted store access: ${session.user.type}`);
      redirect('/?error=unauthorized');
    }

    // Get client details
    const client = await getClientFromId(clientId);
    if (!client) {
      console.error(`[AUTH] Client not found: ${clientId}`);
      redirect('/?error=client_not_found');
    }

    // Verify the authenticated user has access to this client
    if (session.user.clientId !== clientId) {
      console.warn('[AUTH] Client ID mismatch for store access');
      redirect('/?error=client_mismatch');
    }

    return { session, client };
  } catch (error) {
    console.error('[AUTH] Error in requireStore:', error);
    redirect('/?error=auth_error');
  }
}

// Get user session info (safe for client components) - with expiration info
export async function getUserSessionInfo() {
  try {
    const session = await getValidatedSession();

    if (!session?.user) {
      return null;
    }

    // Calculate time until expiration
    let expiresIn: number | null = null;
    if (session.expires) {
      const expiresAt = new Date(session.expires).getTime();
      expiresIn = Math.max(0, expiresAt - Date.now());
    }

    // Return only safe, non-sensitive user info
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      type: session.user.type,
      expiresIn: expiresIn ? Math.round(expiresIn / 1000) : null, // seconds
      // Only include clientId if user is a client
      ...(session.user.type === 'client' && { clientId: session.user.clientId })
    };
  } catch (error) {
    console.error('[AUTH] Error getting user session info:', error);
    return null;
  }
}

// Check if user has specific role/access with expiration check
export async function hasPermission(requiredType: 'admin' | 'client', clientId?: string): Promise<boolean> {
  try {
    const session = await getValidatedSession();

    if (!session?.user) {
      return false;
    }

    // Check user type
    if (session.user.type !== requiredType) {
      return false;
    }

    // For client users, optionally verify specific client access
    if (requiredType === 'client' && clientId) {
      return session.user.clientId === clientId;
    }

    return true;
  } catch (error) {
    console.error('[AUTH] Error checking permission:', error);
    return false;
  }
}

// Session monitoring helper - using allowed console methods
export function logSessionActivity(action: string, userId?: string) {
  if (process.env.NODE_ENV === 'production') {
    // In production, we'd send this to a logging service
    console.warn(`[SESSION] ${action} for user: ${userId || 'unknown'}`);
  } else {
    console.warn(`[SESSION] ${action} for user: ${userId || 'unknown'}`);
  }
}