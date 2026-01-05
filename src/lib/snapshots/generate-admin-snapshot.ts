// scripts/generate-admin-snapshot.ts - CORRECTED
import { prisma } from '@/lib/prisma'
import { writeSnapshot } from '@/lib/snapshots/snapshot-writer'

export async function generateAdminSnapshot() {
  const startTime = Date.now()
  
  try {
    console.warn('🔄 Generating admin dashboard snapshot...')
    
    // Get data from database
    const [totalClients, activeClients, totalClientUsers, recentClients] = await Promise.all([
      prisma.clients.count(),
      prisma.clients.count({ where: { status: 'active' } }),
      prisma.client_users.count({ where: { is_active: true } }),
      prisma.clients.findMany({
        take: 20, // ✅ Get 20, don't query 5 and slice to 20
        orderBy: { created_at: 'desc' },
        select: {
          client_id: true,
          company_name: true,
          client_name: true,
          email: true,
          status: true,
          created_at: true,
        }
      })
    ])
    
    // Create snapshot
    await writeSnapshot({
      type: 'admin',
      version: 1,
      data: {
        totalClients,
        activeClients,
        totalClientUsers,
        recentClients // Already limited to 20
      }
    })
    
    const duration = Date.now() - startTime
    
    console.warn('✅ Admin snapshot generated successfully')
    console.warn(`   Total Clients: ${totalClients}`)
    console.warn(`   Active Clients: ${activeClients}`)
    console.warn(`   Client Users: ${totalClientUsers}`)
    console.warn(`   Duration: ${duration}ms`)
    
    return { 
      success: true, 
      duration, 
      totalClients, 
      activeClients, 
      totalClientUsers 
    }
    
  } catch (error) {
    console.error('❌ Failed to generate admin snapshot:', error)
    throw error // Re-throw for API endpoint to catch
  }
}

// ✅ REMOVED: Self-execute block - we only use via API now