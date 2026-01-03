// scripts/generate-admin-snapshot.ts - FIXED
import { writeSnapshot } from '@/lib/snapshots/snapshot-writer'
import { prisma } from '@/lib/prisma'

async function main() {
  try {
    console.info('🔄 Generating admin dashboard snapshot...')
    
    // Get data from database
    const [totalClients, activeClients, totalClientUsers, recentClients] = await Promise.all([
      prisma.clients.count(),
      prisma.clients.count({ where: { status: 'active' } }),
      prisma.client_users.count({ where: { is_active: true } }),
      prisma.clients.findMany({
        take: 5,
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
    
    // Create snapshot using writeSnapshot function
    await writeSnapshot({
      type: 'admin',
      version: 1,
      data: {
        totalClients,
        activeClients,
        totalClientUsers,
        recentClients: recentClients.slice(0, 20)
      }
    })
    
    console.info('✅ Admin snapshot generated successfully')
    console.info(`   Total Clients: ${totalClients}`)
    console.info(`   Active Clients: ${activeClients}`)
    console.info(`   Client Users: ${totalClientUsers}`)
    
  } catch (error) {
    console.error('❌ Failed to generate admin snapshot:', error)
    process.exit(1)
  }
}

main()