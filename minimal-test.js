const { PrismaClient } = require('@prisma/client')
console.info('PrismaClient imported successfully')

const prisma = new PrismaClient()
console.info('PrismaClient instance created')

// Try the simplest query
prisma.$queryRaw`SELECT 1 as test`
  .then(result => {
    console.info('✅ Success:', result)
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error.message)
    console.error('Details:', error)
    process.exit(1)
  })
