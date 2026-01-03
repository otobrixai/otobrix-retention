import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const connectionString =
      process.env.DATABASE_URL_WITH_POOLER ||
      process.env.DATABASE_URL ||
      'postgresql://postgres@localhost:5432/otobrix_dev?sslmode=disable'

    const pool = new Pool({
      connectionString,
      max: process.env.NODE_ENV === 'production' ? 20 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000, // Increased from 5000 to 30000 (30 seconds)
      query_timeout: 45000, // Add query timeout
      statement_timeout: 45000, // Add statement timeout
    })

    const adapter = new PrismaPg(pool)

    const client = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
      transactionOptions: {
        maxWait: 30000, // Increased from 10000
        timeout: 60000, // Increased from 30000
      },
      errorFormat:
        process.env.NODE_ENV === 'production'
          ? 'minimal'
          : 'colorless',
    })

    console.warn('✅ Prisma Client initialized with extended timeouts')
    return client
  })()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma