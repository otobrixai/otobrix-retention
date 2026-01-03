const { PrismaClient } = require('@prisma/client')

async function test() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing connection...')
    
    // Test 1: Raw query
    const version = await prisma.$queryRaw`SELECT version()`
    console.log('PostgreSQL version:', version[0].version)
    
    // Test 2: Count tables
    const adminCount = await prisma.admin_users.count()
    console.log(`admin_users count: ${adminCount}`)
    
    const clientsCount = await prisma.clients.count()
    console.log(`clients count: ${clientsCount}`)
    
    console.log('✅ All tests passed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
