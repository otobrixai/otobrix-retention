// src/lib/actions/admin.ts - COMPLETE UPDATED VERSION
'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/server-auth'
import { serverOnly } from '@/lib/server-only'
import { z } from 'zod'

interface RecentClient {
  client_id: string;
  company_name: string | null;
  client_name: string;
  email: string;
  status: string;
  created_at: Date;
}

interface DashboardStats {
  stats: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    totalClientUsers: number;
  } | null; // Add null for degraded state
  recentClients: RecentClient[];
  metadata: {
    fetchedAt: Date;
    dataSource: string;
    performance: 'normal' | 'degraded' | 'error';
    queryTimeMs: number;
    cached?: boolean;
    cacheAgeMs?: number;
    originalQueryTime?: number;
    stale?: boolean;
    error?: string;
    note?: string;
    degraded?: boolean; // Add degraded flag
  };
}

export interface DashboardSnapshotData {
  totalClients?: number;
  activeClients?: number;
  totalClientUsers?: number;
  recentClients?: Array<{
    client_id?: string;
    company_name?: string | null;
    client_name?: string;
    email?: string;
    status?: string;
    created_at?: string | Date;
  }>;
}

// Validation schemas
const clientSchema = z.object({
  client_name: z.string()
    .min(1, 'Client name is required')
    .max(100, 'Client name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-.,&'()]+$/, 'Invalid characters in client name'),
  
  email: z.string()
    .email('Please provide a valid email address')
    .max(150, 'Email must be less than 150 characters'),
  
  company_name: z.string()
    .max(200, 'Company name must be less than 200 characters')
    .optional()
    .nullable(),
  
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
})

const deleteClientSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required')
})

const emailTestSchema = z.object({
  email: z.string().email('Valid email required for test')
})

// Get all clients - enhanced with validation
export async function getClients(page: number = 1, limit: number = 10) {
  serverOnly()
  await requireAdmin()
  
  try {
    // Validate inputs
    if (page < 1) page = 1
    if (limit < 1 || limit > 100) limit = 10
    
    // ✅ HARD CAP: Prevent deep table scans
    if (page > 10) {
      throw new Error('Pagination limit exceeded. Maximum page is 10.')
    }
    
    const skip = (page - 1) * limit;
    
    // Get total count from snapshot first
    const snapshot = await prisma.dashboardSnapshot.findFirst({
      where: {
        type: 'admin',
        subjectId: null
      },
      orderBy: { createdAt: 'desc' },
      select: { data: true }
    })
    
    let totalCount = 0
    if (snapshot?.data && typeof snapshot.data === 'object') {
      const data = snapshot.data as DashboardSnapshotData
      totalCount = data.totalClients || 0
    }
    
    // Fetch paginated clients
    const clients = await prisma.clients.findMany({
      select: {
        client_id: true,
        client_name: true,
        company_name: true,
        email: true,
        status: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc'
      },
      skip,
      take: limit,
    })
    
    return { 
      clients,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        totalCount,
        hasNext: (skip + clients.length) < totalCount,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Error fetching clients:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch clients')
  }
}

// Get dashboard stats - using DashboardSnapshot as required
export async function getDashboardStats(): Promise<DashboardStats> {
  serverOnly()
  await requireAdmin()
  
  const startTime = Date.now()
  
  try {
    // ✅ SINGLE READ from DashboardSnapshot as instructed
    const snapshot = await prisma.dashboardSnapshot.findFirst({
      where: {
        type: 'admin',
        subjectId: null  // Admin dashboard
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Graceful failure instead of throw
    if (!snapshot) {
      return {
        stats: null,
        recentClients: [],
        metadata: {
          fetchedAt: new Date(),
          dataSource: 'DashboardSnapshot',
          performance: 'error',
          queryTimeMs: Date.now() - startTime,
          error: 'Snapshot unavailable - awaiting next refresh cycle',
          degraded: true
        }
      }
    }
    
    // Version guard
    if (snapshot.version !== 1) {
      return {
        stats: null,
        recentClients: [],
        metadata: {
          fetchedAt: new Date(),
          dataSource: 'DashboardSnapshot',
          performance: 'error',
          queryTimeMs: Date.now() - startTime,
          error: `Unsupported snapshot version ${snapshot.version}. Expected v1`,
          degraded: true
        }
      }
    }
    
    // Parse snapshot data
    let statsData = {
      totalClients: 0,
      activeClients: 0,
      totalClientUsers: 0
    }
    
    let recentClients: RecentClient[] = []
    
    try {
      if (snapshot.data && typeof snapshot.data === 'object') {
        const data = snapshot.data as DashboardSnapshotData
        
        // Extract stats
        statsData = {
          totalClients: data.totalClients || 0,
          activeClients: data.activeClients || 0,
          totalClientUsers: data.totalClientUsers || 0
        }
        
        // Extract recent clients
        if (Array.isArray(data.recentClients)) {
          recentClients = data.recentClients.map((item) => ({
            client_id: item.client_id || '',
            company_name: item.company_name || null,
            client_name: item.client_name || '',
            email: item.email || '',
            status: item.status || 'unknown',
            created_at: new Date(item.created_at || Date.now())
          }))
        }
      }
    } catch (parseError) {
      console.warn('Failed to parse dashboard snapshot data:', parseError)
      return {
        stats: null,
        recentClients: [],
        metadata: {
          fetchedAt: new Date(),
          dataSource: 'DashboardSnapshot',
          performance: 'error',
          queryTimeMs: Date.now() - startTime,
          error: 'Invalid snapshot data format',
          degraded: true
        }
      }
    }
    
    const queryTime = Date.now() - startTime
    
    return {
      stats: {
        totalClients: statsData.totalClients,
        activeClients: statsData.activeClients,
        inactiveClients: statsData.totalClients - statsData.activeClients,
        totalClientUsers: statsData.totalClientUsers
      },
      recentClients,
      metadata: {
        fetchedAt: new Date(),
        dataSource: 'DashboardSnapshot',
        performance: queryTime < 1000 ? 'normal' : queryTime < 5000 ? 'degraded' : 'error',
        queryTimeMs: queryTime,
        note: `Snapshot v${snapshot.version}`
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to load admin dashboard snapshot:', error)
    
    // Graceful error response
    return {
      stats: null,
      recentClients: [],
      metadata: {
        fetchedAt: new Date(),
        dataSource: 'error',
        performance: 'error',
        queryTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Dashboard load failed',
        degraded: true
      }
    }
  }
}

// Create new client - enhanced with validation
export async function createClient(formData: FormData) {
  serverOnly()
  await requireAdmin()
  
  try {
    // Validate input
    const rawData = {
      client_name: formData.get('client_name'),
      email: formData.get('email'),
      company_name: formData.get('company_name'),
      status: formData.get('status') || 'active',
    }

    const validationResult = clientSchema.safeParse(rawData)
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return { 
        success: false, 
        error: firstError.message 
      }
    }

    const data = validationResult.data

    // Check for duplicate email
    const existingClient = await prisma.clients.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    })

    if (existingClient) {
      return { 
        success: false, 
        error: 'A client with this email already exists.' 
      }
    }

    const client = await prisma.clients.create({
      data: {
        client_id: generateClientId(),
        company_name: data.company_name,
        client_name: data.client_name.trim(),
        email: data.email.toLowerCase().trim(),
        status: data.status,
        updated_at: new Date(),
      }
    })
    
    // Log instead of revalidating to prevent stampedes
    console.info('Client created. Snapshot will update on next cron run.')
    
    return { 
      success: true, 
      client,
      message: 'Client created successfully'
    }
  } catch (error: unknown) {
    console.error('Error creating client:', error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string }
      if (prismaError.code === 'P2002') {
        return { 
          success: false, 
          error: 'A client with this email already exists.' 
        }
      }
    }
    
    return { 
      success: false, 
      error: 'Failed to create client' 
    }
  }
}

function generateClientId(): string {
  // Use crypto.randomUUID() instead of timestamp + random
  // This prevents collisions under concurrent load
  return 'client_' + crypto.randomUUID()
}

// Delete client - enhanced with validation
export async function deleteClient(clientId: string) {
  serverOnly()
  await requireAdmin()
  
  try {
    // Validate input
    const validationResult = deleteClientSchema.safeParse({ clientId })
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return { 
        success: false, 
        error: firstError.message 
      }
    }

    // Check if client exists before deleting
    const client = await prisma.clients.findUnique({
      where: { client_id: clientId }
    })

    if (!client) {
      return { 
        success: false, 
        error: 'Client not found' 
      }
    }

    await prisma.clients.delete({
      where: { client_id: clientId }
    })
    
    // Log instead of revalidating to prevent stampedes
    console.info('Client deleted. Snapshot will update on next cron run.')
    
    return { 
      success: true,
      message: 'Client deleted successfully'
    }
  } catch (error: unknown) {
    console.error('Error deleting client:', error)
    
    // Handle foreign key constraints
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string }
      if (prismaError.code === 'P2003') {
        return { 
          success: false, 
          error: 'Cannot delete client with associated records' 
        }
      }
    }
    
    return { 
      success: false, 
      error: 'Failed to delete client' 
    }
  }
}

// Test email service - enhanced with validation
export async function testEmailService(email: string) {
  serverOnly()
  await requireAdmin()
  
  try {
    // Validate input
    const validationResult = emailTestSchema.safeParse({ email })
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return { 
        success: false, 
        error: firstError.message 
      }
    }

    // Validate environment variable
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return { 
        success: false, 
        error: 'Application URL not configured' 
      }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/test-email-simple`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Add security headers
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ testEmail: email })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      return { 
        ...result,
        message: 'Email sent successfully'
      }
    } else {
      return {
        success: false,
        error: result.error || 'Failed to send email'
      }
    }
  } catch (error) {
    console.error('Error testing email:', error)
    return { 
      success: false, 
      error: 'Failed to test email service' 
    }
  }
}

// Add this function at the end of src/lib/actions/admin.ts
export async function diagnoseDatabasePerformance() {
  serverOnly()
  await requireAdmin()
  
  // ✅ BLOCK in production
  if (process.env.NODE_ENV === 'production') {
    return {
      status: 'blocked',
      error: 'Database diagnostics disabled in production',
      note: 'Use development environment for diagnostics'
    }
  }
  
  console.warn('🔍 Running database performance diagnosis...')
  
  try {
    const startTime = Date.now()
    
    // ✅ SAFE: Only metadata queries
    // 1. Check for indexes (read-only metadata query)
    const indexes = await prisma.$queryRaw<{
      tablename: string;
      indexname: string;
      indexdef: string;
    }[]>`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename IN ('admin_snapshots')
      ORDER BY tablename, indexname
    `.catch(() => [])
    
    const diagnosisTime = Date.now() - startTime
    
    return {
      status: 'diagnosis_complete',
      timing: {
        totalMs: diagnosisTime,
      },
      indexes,
      note: 'Live aggregation checks disabled per freeze rules'
    }
    
  } catch (error) {
    console.error('Database diagnosis failed:', error)
    return {
      status: 'diagnosis_failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}