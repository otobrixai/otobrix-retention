import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function test() {
  try {
    console.log('Testing database connection...')
    
    // Test connection
    await prisma.()
    console.log('✅ Connected to database successfully!')
    
    // Count records in each table
    console.log('\nCounting records:')
    
    const adminCount = await prisma.admin_users.count()
    console.log(\  admin_users: \\)
    
    const clientsCount = await prisma.clients.count()
    console.log(\  clients: \\)
    
    const clientUsersCount = await prisma.client_users.count()
    console.log(\  client_users: \\)
    
    const rfmConfigsCount = await prisma.rfm_configs.count()
    console.log(\  rfm_configs: \\)
    
    const retentionLogsCount = await prisma.retention_logs.count()
    console.log(\  retention_logs: \\)
    
    const dashboardSnapshotsCount = await prisma.dashboardSnapshot.count()
    console.log(\  DashboardSnapshot: \\)
    
    console.log('\n✅ All tables are accessible!')
    
    // Try to insert a test record
    console.log('\nTesting insert...')
    const testClient = await prisma.clients.create({
      data: {
        company_name: 'Test Company',
        client_name: 'Test Client',
        email: 'test@example.com'
      }
    })
    console.log(\✅ Created test client: \\)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.()
    console.log('\nDisconnected from database')
  }
}

test()
