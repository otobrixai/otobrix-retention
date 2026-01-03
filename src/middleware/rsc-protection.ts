// src/middleware/rsc-protection.ts - Keep RSC endpoint protection
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSettings } from '@/lib/cache'



export function rscProtectionMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Protect RSC endpoints
  if (pathname.includes('_next') && pathname.includes('flight')) {
    const headers = request.headers;
    
    // Validate RSC request headers
    const contentType = headers.get('content-type');
    if (contentType !== 'text/x-component' && contentType !== 'application/json') {
      return new NextResponse('Invalid RSC request', { status: 400 });
    }
    
    // Validate RSC action header
    const rscAction = headers.get('next-action');
    if (!rscAction) {
      return new NextResponse('Missing RSC action', { status: 400 });
    }
    
    // Rate limit RSC actions (prevent DoS)
    const ip = headers.get('x-forwarded-for') || 'unknown';
    const _rscKey = `rsc:${ip}:${rscAction}`; // Prefix with _ to indicate intentional non-use
    // Implement rate limiting here using your rate-limit.ts
    
    // Validate payload size
    const contentLength = headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
      return new NextResponse('RSC payload too large', { status: 413 });
    }
    // Check maintenance mode
    const settings = getAdminSettings()

    if (settings.maintenanceMode) {
      return Response.redirect(new URL('/maintenance', request.url))
    }

  }
  
  return NextResponse.next();
}