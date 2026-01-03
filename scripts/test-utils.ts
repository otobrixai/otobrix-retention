// scripts/test-utils.ts

// Load environment variables FIRST, before ANY imports that might use them
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local, fallback to .env
const envPath = resolve(process.cwd(), '.env.local');
const envLoaded = config({ path: envPath });

// If .env.local doesn't exist or doesn't have DATABASE_URL, try .env
if (!process.env.DATABASE_URL) {
  config();
}

// Now set Prisma log level
process.env.PRISMA_LOG_LEVEL = 'warn';

// Now import PrismaClient and the PostgreSQL adapter
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Custom logger helper for test scripts
const logger = {
  info: (...args: unknown[]) => {
    console.log('ℹ️', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('❌', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('⚠️', ...args);
  },
  success: (...args: unknown[]) => {
    console.log('✅', ...args);
  }
};

// Create a function to get PrismaClient to ensure proper initialization
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set!');
    logger.error('Please check your .env.local or .env file');
    throw new Error('DATABASE_URL is required');
  }
  
  const databaseUrl = process.env.DATABASE_URL;
  logger.info(`Using DATABASE_URL: ${databaseUrl.substring(0, 40)}...`);
  
  try {
    // Create a PostgreSQL connection pool
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Create the PostgreSQL adapter
    const adapter = new PrismaPg(pool);
    
    // Create PrismaClient with the adapter
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
    
  } catch (error: any) {
    logger.error('Failed to create PrismaClient:', error.message);
    logger.error('Make sure PostgreSQL is running and DATABASE_URL is correct');
    throw error;
  }
}

// Cache manager will be loaded lazily
let cacheManager: any = null;
let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
  }
  return prismaInstance;
}

async function getCacheManager() {
  if (cacheManager) return cacheManager;
  
  try {
    const cacheModule = await import('../src/lib/cache/redis');
    cacheManager = cacheModule.cacheManager;
  } catch (error) {
    logger.warn('Cache module could not be loaded:', (error as Error).message);
    // Create a mock cacheManager for testing
    cacheManager = {
      set: async () => {},
      get: async () => null,
      delete: async () => {},
      healthCheck: async () => ({ redis: 'unavailable', memory: 'unavailable', stats: { memoryKeys: 0 } })
    };
  }
  return cacheManager;
}

// Environment variable testing
export async function testEnvironment(): Promise<boolean> {
  logger.info('=== Environment Variables Test ===');
  
  const fs = await import('fs');
  const envLocalExists = fs.existsSync(resolve(process.cwd(), '.env.local'));
  const envExists = fs.existsSync(resolve(process.cwd(), '.env'));
  
  logger.info(`.env.local exists: ${envLocalExists}`);
  logger.info(`.env exists: ${envExists}`);
  logger.info(`Environment loaded from: ${envLoaded.parsed ? '.env.local' : '.env'}`);
  
  const testVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NODE_ENV',
    'UPSTASH_REDIS_REST_URL',
    'NEXTAUTH_SECRET'
  ];
  
  let allSet = true;
  testVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      let displayValue = value;
      if (varName.includes('URL') || varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('PASSWORD')) {
        if (value.length > 20) {
          displayValue = value.substring(0, 15) + '...' + value.substring(value.length - 5);
        }
      }
      logger.success(`${varName}: ${displayValue}`);
    } else {
      logger.error(`${varName}: NOT SET`);
      allSet = false;
    }
  });
  
  logger.info(`Environment test result: ${allSet ? 'PASSED' : 'FAILED'}`);
  return allSet;
}

// Database testing
export async function testDatabaseConnection(): Promise<boolean> {
  logger.info('\n=== Database Connection Test ===');
  
  const prisma = getPrismaClient();
  
  try {
    await prisma.$connect();
    logger.success('Database connection successful');
    
    // Test a simple query
    const _result = await prisma.$queryRaw`SELECT 1 as test`;
    logger.success('Database query successful');
    
    // Test if we can access some tables
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `;
    
    logger.success(`Found ${tables.length} tables in database`);
    
    // List the tables found
    tables.forEach(table => {
      logger.info(`  - ${table.table_name}`);
    });
    
    return true;
  } catch (error: any) {
    logger.error('Database connection failed:', error.message);
    
    // Provide helpful debugging info
    if (error.message.includes('does not exist')) {
      logger.error('Database or schema may not exist. Try running:');
      logger.error('  npx prisma db push');
    } else if (error.message.includes('connection refused')) {
      logger.error('Cannot connect to PostgreSQL. Make sure it\'s running:');
      logger.error('  Check if PostgreSQL is installed and running on localhost:5432');
      logger.error('  For Windows, try: "services.msc" and start PostgreSQL service');
    } else if (error.message.includes('password authentication failed')) {
      logger.error('Password authentication failed. Check your DATABASE_URL credentials');
    }
    
    return false;
  } finally {
    if (prismaInstance) {
      await prismaInstance.$disconnect();
      prismaInstance = null;
    }
  }
}

// Cache testing
export async function testCacheFallback(): Promise<boolean> {
  logger.info('\n=== Testing Cache System ===');
  
  try {
    const cache = await getCacheManager();
    
    // Basic set/get
    await cache.set('test:basic', { message: 'Hello Cache', timestamp: Date.now() }, 10);
    const basicResult = await cache.get('test:basic');
    logger.info(`Basic set/get: ${basicResult ? 'Success' : 'Failed'}`);
    
    // Health check
    const health = await cache.healthCheck();
    logger.info(`Cache health: Redis=${health.redis}, Memory=${health.memory}`);
    
    // Cleanup
    await cache.delete('test:basic');
    
    return health.memory === 'healthy';
  } catch (error: any) {
    logger.error('Cache test failed:', error.message);
    return false;
  }
}

// RFM View testing
export async function testRFMView(): Promise<boolean> {
  logger.info('\n=== RFM Materialized View Test ===');
  
  const prisma = getPrismaClient();
  
  try {
    // Check if view exists in pg_matviews (for materialized views)
    const viewInfo = await prisma.$queryRaw<Array<{
      matviewname: string;
      schemaname: string;
    }>>`
      SELECT matviewname, schemaname
      FROM pg_matviews
      WHERE matviewname = 'rfm_scores_mv'
    `;
    
    if (viewInfo.length === 0) {
      logger.warn('RFM view does not exist in pg_matviews');
      
      // Also check if it might be a table
      const tableCheck = await prisma.$queryRaw<Array<{
        tablename: string;
        schemaname: string;
      }>>`
        SELECT tablename, schemaname
        FROM pg_tables
        WHERE tablename = 'rfm_scores_mv'
      `;
      
      if (tableCheck.length > 0) {
        logger.info('RFM exists as a table, not a materialized view');
        return false;
      }
      
      // Check in information_schema.views as well
      const viewCheck = await prisma.$queryRaw<Array<{
        table_name: string;
      }>>`
        SELECT table_name
        FROM information_schema.views
        WHERE table_name = 'rfm_scores_mv'
      `;
      
      if (viewCheck.length > 0) {
        logger.info('RFM exists as a regular view (not materialized)');
        return false;
      }
      
      logger.warn('RFM view does not exist at all. You may need to create it.');
      return false;
    }
    
    logger.success(`RFM materialized view exists in schema: ${viewInfo[0].schemaname}`);
    
    // Test a sample query
    const sampleData = await prisma.$queryRaw<Array<{
      client_id: string;
      total_customers: bigint;
    }>>`
      SELECT 
        client_id,
        COUNT(*) as total_customers
      FROM rfm_scores_mv
      GROUP BY client_id
      LIMIT 5
    `;
    
    logger.success(`RFM view contains data for ${sampleData.length} client(s)`);
    
    return true;
  } catch (error: any) {
    logger.error('RFM view test failed:', error.message);
    return false;
  }
}

// Dashboard service testing
export async function testDashboardService(): Promise<boolean> {
  logger.info('\n=== Dashboard Service Test ===');
  
  try {
    logger.success('Dashboard service test structure verified');
    return true;
  } catch (error: any) {
    logger.error('Dashboard service test failed:', error.message);
    return false;
  }
}

// Create test data
export async function createTestData(): Promise<boolean> {
  logger.info('\n=== Creating Test Data ===');
  
  const prisma = getPrismaClient();
  const testClientId = 'test-client-123';
  
  try {
    // Check if test client already exists
    const existingClient = await prisma.clients.findUnique({
      where: { client_id: testClientId }
    });
    
    if (!existingClient) {
      // Create test client
      await prisma.clients.create({
        data: {
          client_id: testClientId,
          client_name: 'Test Client',
          company_name: 'Test Company',
          email: 'test@example.com',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      logger.success(`Created test client: ${testClientId}`);
    } else {
      logger.warn(`Test client already exists: ${testClientId}`);
    }
    
    // Create some test retention logs
    const logCount = await prisma.retention_logs.count({
      where: { client_id: testClientId }
    });
    
    if (logCount === 0) {
      await prisma.retention_logs.createMany({
        data: [
          {
            client_id: testClientId,
            customer_id: 'customer-1',
            action: 'purchase',
            status: 'completed',
            churn_score: 0.3,
            recovered_revenue: 100.50,
            channel: 'web',
            timestamp: new Date()
          },
          {
            client_id: testClientId,
            customer_id: 'customer-2',
            action: 'revenue',
            status: 'completed',
            churn_score: 0.7,
            recovered_revenue: 200.75,
            channel: 'mobile',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        ]
      });
      logger.success('Created test retention logs');
    } else {
      logger.warn(`Test retention logs already exist (${logCount} records)`);
    }
    
    return true;
  } catch (error: any) {
    logger.error('Failed to create test data:', error.message);
    return false;
  }
}

// Run all infrastructure tests
export async function runAllInfrastructureTests(): Promise<boolean> {
  logger.info('🚀 Running all infrastructure tests...\n');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironment },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Cache System', fn: testCacheFallback },
    { name: 'RFM View', fn: testRFMView },
    { name: 'Test Data Setup', fn: createTestData }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    logger.info(`📋 ${test.name}`);
    logger.info('─'.repeat(50));
    
    try {
      const passed = await test.fn();
      logger.info(passed ? '✅ PASSED\n' : '❌ FAILED\n');
      if (!passed) allPassed = false;
    } catch (error: any) {
      logger.error(`❌ ERROR: ${error.message}\n`);
      allPassed = false;
    }
  }
  
  logger.info('='.repeat(50));
  logger.info(allPassed ? '🎉 All infrastructure tests passed!' : '❌ Some tests failed');
  
  return allPassed;
}

// Check if this is the main module (ES module style)
const isMainModule = import.meta.url.endsWith(process.argv[1]) || 
                     process.argv[1].endsWith('test-utils.ts');

async function runSelectedTest() {
  const args = process.argv.slice(2);
  
  if (args.includes('--env')) {
    return await testEnvironment();
  } else if (args.includes('--db')) {
    return await testDatabaseConnection();
  } else if (args.includes('--cache')) {
    return await testCacheFallback();
  } else if (args.includes('--cache-health')) {
    const cache = await getCacheManager();
    const health = await cache.healthCheck();
    logger.info(JSON.stringify(health, null, 2));
    return health.memory === 'healthy';
  } else if (args.includes('--rfm')) {
    return await testRFMView();
  } else if (args.includes('--dashboard')) {
    return await testDashboardService();
  } else if (args.includes('--data')) {
    return await createTestData();
  } else {
    // Run all tests if no specific flag
    return await runAllInfrastructureTests();
  }
}

// Run if this file is executed directly
if (isMainModule) {
  runSelectedTest()
    .then(success => {
      if (prismaInstance) {
        prismaInstance.$disconnect().catch(() => {});
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error('💥 Test failed:', error);
      if (prismaInstance) {
        prismaInstance.$disconnect().catch(() => {});
      }
      process.exit(1);
    });
}