// src/proxy.ts - Fixed imports and type issues
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Apply rate limiting to admin API endpoints
  if (pathname.startsWith('/api/admin/')) {
    const rateLimitResult = await checkRateLimit(request, 'ADMIN', 'admin')
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests to admin endpoints. Please try again later.',
          resetTime: rateLimitResult.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 'ADMIN'),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    // Continue with the request and add rate limit headers
    const response = NextResponse.next()
    
    // Add rate limit headers to all admin API responses
    const headers = getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 'ADMIN')
    Object.entries(headers).forEach(
      ([key, value]) => {
        response.headers.set(key, value)
      }
    )
    
    return response
  }
  
  // Apply rate limiting to auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    const rateLimitResult = await checkRateLimit(request, 'LOGIN')
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many authentication attempts. Please try again later.',
          resetTime: rateLimitResult.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 'LOGIN'),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    // Continue with the request and add rate limit headers
    const response = NextResponse.next()
    
    const headers = getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 'LOGIN')
    Object.entries(headers).forEach(
      ([key, value]) => {
        response.headers.set(key, value as string)
      }
    )
    
    return response
  }
  
  // Apply general rate limiting to all other API endpoints
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
    const rateLimitResult = await checkRateLimit(request, 'API')
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 'API'),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    // Continue with the request and add rate limit headers
    const response = NextResponse.next()
    
    const headers = getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 'API')
    Object.entries(headers).forEach(
      ([key, value]) => {
        response.headers.set(key, value as string)
      }
    )
    
    return response
  }
  
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/api/:path*',
    // Skip rate limiting for health checks and static files
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}