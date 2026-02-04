// scripts/setup-db-views.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });
if (!process.env.DATABASE_URL) {
  config();
}

async function main() {
  console.info('🏗️ Setting up database views and functions...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.info('🚿 Dropping existing view if it exists...');
    await prisma.$executeRaw`DROP MATERIALIZED VIEW IF EXISTS rfm_scores_mv CASCADE;`;

    console.info('🧱 Creating rfm_scores_mv materialized view...');
    // This view aggregates the logs per customer to get the latest RFM state
    // We use DISTINCT ON to ensure exactly one row per customer, picking their most recent log's segment
    await prisma.$executeRaw`
      CREATE MATERIALIZED VIEW rfm_scores_mv AS
      WITH customer_metrics AS (
        SELECT 
          client_id,
          customer_id,
          MAX(rfm_recency) as rfm_recency,
          MAX(rfm_frequency) as rfm_frequency,
          MAX(rfm_monetary) as rfm_monetary,
          AVG(churn_score) as churn_score,
          SUM(COALESCE(total_spent, 0)) as total_spent,
          MAX(timestamp) as last_activity
        FROM retention_logs
        GROUP BY client_id, customer_id
      ),
      latest_segments AS (
        SELECT DISTINCT ON (client_id, customer_id)
          client_id,
          customer_id,
          customer_segment
        FROM retention_logs
        ORDER BY client_id, customer_id, timestamp DESC
      )
      SELECT 
        m.*,
        s.customer_segment,
        NOW() as calculated_at
      FROM customer_metrics m
      JOIN latest_segments s ON m.client_id = s.client_id AND m.customer_id = s.customer_id;
    `;

    console.info('🔍 Creating unique index for concurrent refresh...');
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX rfm_scores_mv_client_customer_idx ON rfm_scores_mv (client_id, customer_id);
    `;

    console.info('⚙️  Creating refresh function...');
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION refresh_rfm_scores_mv()
      RETURNS void AS $$
      BEGIN
          REFRESH MATERIALIZED VIEW CONCURRENTLY rfm_scores_mv;
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.info('✅ Database views and functions set up successfully!');

  } catch (error) {
    console.error('💥 Setup failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
