const { PrismaClient } = require('@prisma/client')
console.log('PrismaClient imported successfully')

const prisma = new PrismaClient()
console.log('PrismaClient instance created')

// Try the simplest query
prisma.\SELECT 1 as test\
  .then(result => {
    console.log('✅ Success:', result)
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error.message)
    console.error('Details:', error)
    process.exit(1)
  })
