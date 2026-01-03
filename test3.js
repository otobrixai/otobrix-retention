const { PrismaClient } = require('@prisma/client')

async function test() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing Prisma connection...')
    
    // Use parameterized query without backticks
    const result = await prisma.\('SELECT 1 as test')
    console.log('Success:', result)
    
    // Count clients
    const count = await prisma.clients.count()
    console.log(\Clients in database: \\)
    
  } catch (error) {
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.\()
  }
}

test()
