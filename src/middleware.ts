// src/middleware.ts - Next.js middleware for rate limiting
import { NextRequest, NextResponse } from 'next/server'
import { proxy } from '@/proxy'

export async function middleware(request: NextRequest) {
  // Use the proxy function for rate limiting
  return await proxy(request)
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/:path*',
  ],
}
