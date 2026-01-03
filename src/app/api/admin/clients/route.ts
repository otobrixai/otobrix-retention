// src/app/api/admin/clients/route.ts - UPDATED WITH CSRF
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { withCSRFProtection } from '@/lib/csrf'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import type { DashboardSnapshotData } from '@/lib/actions/admin'

export const runtime = 'nodejs'
export const revalidate = 60;
export const dynamic = 'force-dynamic';

// Helper to require admin with proper error handling
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.type !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}


export async function GET(request: NextRequest) {
  try {
    const _session = await requireAdmin()
    
    // Apply rate limiting
    const rateLimit = await checkRateLimit(request, 'API')
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests',
          message: 'Rate limit exceeded'
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime)
          }
        }
      )
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const clients = await prisma.clients.findMany({
      select: {
        client_id: true,
        client_name: true,
        company_name: true,
        email: true,
        status: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: 50,
    });

    // ✅ FIX: Get real total from snapshot, not placeholder
    const snapshot = await prisma.dashboardSnapshot.findFirst({
      where: {
        type: 'admin',
        subjectId: null
      },
      orderBy: { createdAt: 'desc' },
      select: { data: true, createdAt: true }
    });

    let totalCount = clients.length; // Fallback
    let snapshotAge = 'unknown';
    let dataSource = 'live_fallback';

    if (snapshot?.data && typeof snapshot.data === 'object') {
      const data = snapshot.data as DashboardSnapshotData;
      totalCount = data.totalClients || clients.length;
      
      const ageMs = Date.now() - new Date(snapshot.createdAt).getTime();
      const ageMinutes = Math.floor(ageMs / 60000);
      snapshotAge = ageMinutes < 60 ? `${ageMinutes}m` : `${Math.floor(ageMinutes / 60)}h`;
      dataSource = 'snapshot';
    }

    const response = NextResponse.json({
      clients,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
        limit,
        snapshotAge, // Freshness info
        dataSource
      }
    });
    
    // Add rate limit headers
    Object.entries(getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime))
      .forEach(([key, value]) => {
        response.headers.set(key, value)
      });
    
    return response;

  } catch (error: unknown) {
    console.error('[API ERROR] GET clients failed')
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return withCSRFProtection(request, async () => {
    try {
      const _session = await requireAdmin()
      
      // Apply rate limiting for creation
      const rateLimit = await checkRateLimit(request, 'API')
      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Too many requests',
            message: 'Rate limit exceeded'
          }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime)
            }
          }
        )
      }

      const body = await request.json()
      const { client_name, company_name, email, status = 'active' } = body

      // Validation
      if (!client_name?.trim()) {
        return NextResponse.json(
          { error: 'Client name is required' },
          { status: 400 }
        )
      }

      if (!email?.trim()) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if client already exists
      const existingClient = await prisma.clients.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (existingClient) {
        return NextResponse.json(
          { error: 'A client with this email already exists' },
          { status: 409 }
        )
      }

      // Generate client ID
      const clientId = `client_${crypto.randomBytes(8).toString('hex')}`

      // Create client
      const client = await prisma.clients.create({
        data: {
          client_id: clientId,
          client_name: client_name.trim(),
          company_name: company_name?.trim() || null,
          email: email.toLowerCase().trim(),
          status,
          created_at: new Date(),
          updated_at: new Date()
        }
      })

      // Generate secure random password for client user
      const temporaryPassword = crypto.randomBytes(16).toString('hex')
      const passwordHash = await bcrypt.hash(temporaryPassword, 12)

      // Create client_users record
      await prisma.client_users.create({
        data: {
          id: crypto.randomUUID(),
          client_id: clientId,
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          requires_password_change: true,
          is_active: true,
          role: 'client',
          created_at: new Date(),
          updated_at: new Date()
        }
      })

      console.info(`✅ Created client and client_user for: ${email}`)

      const response = NextResponse.json({
        success: true,
        client: {
          client_id: client.client_id,
          client_name: client.client_name,
          company_name: client.company_name,
          email: client.email,
          status: client.status,
          created_at: client.created_at
        },
        message: 'Client created successfully. They can now set up their password.'
      })

      // Add rate limit headers
      Object.entries(getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime))
        .forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      
      return response

    } catch (error: unknown) {
      console.error('[API ERROR] POST clients failed')
      
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      )
    }
  })
}

// In the PUT function:
export async function PUT(request: NextRequest) {
  return withCSRFProtection(request, async () => {
    try {
      await requireAdmin()
      // Your update logic here
      return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
    } catch (_error: unknown) { // ✅ Change 'error' to '_error'
      console.error('[API ERROR] PUT clients failed')
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withCSRFProtection(request, async () => {
    try {
      await requireAdmin()
      // Your delete logic here  
      return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
    } catch (_error: unknown) { // ✅ Change 'error' to '_error'
      console.error('[API ERROR] DELETE clients failed')
      return NextResponse.json(
        { error: 'Failed to delete client' },
        { status: 500 }
      )
    }
  })
}