// src/app/api/csrf-token/route.ts
import { NextResponse } from 'next/server';
import { generateCSRFToken, serverOnly } from '@/lib/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  serverOnly(); // Ensure server-only execution
  
  try {
    const token = await generateCSRFToken();
    
    return NextResponse.json({
      success: true,
      csrfToken: token,
      message: 'CSRF token generated successfully',
      timestamp: new Date().toISOString(),
      expiresIn: '30 minutes'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      }
    });
  } catch (error) {
    console.error('[CSRF] Token generation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate CSRF token',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  }
}