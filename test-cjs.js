// Use CommonJS require
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // Test with a raw query first
    const result = await prisma.\SELECT version()\
    console.log('PostgreSQL version:', result[0].version)
    
    // Test table access
    const count = await prisma.clients.count()
    console.log(\Clients count: \\)
    
  } catch (error) {
    console.error('Failed:', error.message)
  } finally {
    await prisma.()
  }
}

main()
