const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing database connection...')
    
    // Simple connection test
    const result = await prisma.\SELECT 1 as test\
    console.log('✅ Database connection successful:', result)
    
    // Test if we can query admin_users
    const adminCount = await prisma.admin_users.count()
    console.log(\✅ admin_users table accessible. Count: \\)
    
    // Test insert into clients
    const newClient = await prisma.clients.create({
      data: {
        company_name: 'Test Company',
        client_name: 'Test Client',
        email: 'test@example.com'
      }
    })
    console.log(\✅ Created test client with ID: \\)
    
    // Clean up test data
    await prisma.clients.delete({
      where: { client_id: newClient.client_id }
    })
    console.log('✅ Cleaned up test data')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.()
  }
}

test()
