// scripts/seed-mock-client.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });
if (!process.env.DATABASE_URL) {
  config();
}

async function main() {
  console.info('🌱 Starting portfolio mock data seeding...');
  
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
    const clientEmail = 'portfolio@example.com';
    const clientName = 'Portfolio Enterprise';
    const companyName = 'Global AI Solutions Inc.';
    const now = new Date();

    // 1. Create/Upsert Client
    console.info(`🏢 upserting client: ${clientName}...`);
    const client = await prisma.clients.upsert({
      where: { email: clientEmail },
      update: {
        client_name: clientName,
        company_name: companyName,
        status: 'active',
        setup_status: 'completed',
        updated_at: now,
      },
      create: {
        email: clientEmail,
        client_name: clientName,
        company_name: companyName,
        status: 'active',
        setup_status: 'completed',
        created_at: now,
        updated_at: now,
      },
    });

    // 2. Create/Upsert Client User
    console.info(`👤 Creating client user for ${clientEmail}...`);
    const passwordHash = await bcrypt.hash('Portfolio123!', 12);
    await prisma.client_users.upsert({
      where: { 
        client_id_email: {
          client_id: client.client_id,
          email: clientEmail
        }
      },
      update: {
        password_hash: passwordHash,
        is_active: true,
        updated_at: now,
      },
      create: {
        client_id: client.client_id,
        email: clientEmail,
        password_hash: passwordHash,
        role: 'client',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    });

    // 3. RFM Config
    console.info(`⚙️  Setting up RFM config...`);
    await prisma.rfm_configs.upsert({
      where: { client_id: client.client_id },
      update: { updated_at: now },
      create: {
        client_id: client.client_id,
        recency_divisor: 90,
        frequency_divisor: 10,
        monetary_divisor: 1000,
        recency_weight: 0.4,
        frequency_weight: 0.3,
        monetary_weight: 0.3,
        created_at: now,
        updated_at: now,
      },
    });

    // 4. Client Preferences
    console.info(`🎨 Setting up client preferences...`);
    await prisma.clientPreferences.upsert({
      where: { client_id: client.client_id },
      update: { updated_at: now },
      create: {
        client_id: client.client_id,
        ai_risk_alerts: true,
        weekly_report: true,
        email_notifications: true,
        created_at: now,
        updated_at: now,
      },
    });

    // 5. Generate Retention Logs (1000 logs)
    console.info(`📊 Generating 1000 retention logs (this might take a few seconds)...`);
    
    // Clear existing logs for this mock client to avoid bloat if re-run
    await prisma.retention_logs.deleteMany({
      where: { client_id: client.client_id }
    });

    const actionTypes = ['purchase', 'revenue', 'email_open', 'email_click', 'churn_risk_flag', 'support_ticket'];
    const channels = ['web', 'email', 'mobile', 'pos'];
    const segments = ['Champions', 'Loyal', 'Potential Loyalist', 'At Risk', 'Lost', 'High Value', 'Regular', 'Recent Customers'];
    
    const logs = [];
    const customerIds = Array.from({ length: 200 }, (_, i) => `cust-${i + 1}`);

    for (let i = 0; i < 1000; i++) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 180)); // Last 180 days
        
        const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        const isRevenue = action === 'purchase' || action === 'revenue';
        const revenueValue = isRevenue ? (Math.random() * 500 + 20) : null;

        // Generate RFM values based on simulated "quality" of the customer record
        const rfmRecency = Math.floor(Math.random() * 5) + 1; // 1-5 scale
        const rfmFrequency = Math.floor(Math.random() * 5) + 1;
        const rfmMonetary = Math.floor(Math.random() * 5) + 1;

        logs.push({
            client_id: client.client_id,
            customer_id: customerIds[Math.floor(Math.random() * customerIds.length)],
            action: action,
            status: 'completed',
            channel: channels[Math.floor(Math.random() * channels.length)],
            timestamp: timestamp,
            churn_score: Math.random(),
            rfm_recency: rfmRecency,
            rfm_frequency: rfmFrequency,
            rfm_monetary: rfmMonetary,
            customer_segment: segments[Math.floor(Math.random() * segments.length)],
            total_spent: revenueValue,
            recovered_revenue: action === 'purchase' && Math.random() > 0.7 ? (revenueValue ? (revenueValue as number) * 0.5 : 0) : 0,
            created_at: now,
            updated_at: now,
        });

        // Batch insert every 200 logs
        if (logs.length === 200) {
            await prisma.retention_logs.createMany({ data: [...logs] });
            logs.length = 0;
        }
    }
    
    // Insert any remaining logs
    if (logs.length > 0) {
        await prisma.retention_logs.createMany({ data: logs });
    }

    console.info('✅ 1000 logs created.');

    // 6. Refresh RFM Materialized View
    console.info('🔄 Refreshing RFM materialized view...');
    try {
        await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY rfm_scores_mv`;
        console.info('✅ RFM view refreshed.');
    } catch (e) {
        console.warn('⚠️ Could not refresh materialized view concurrently (might not exist or not initialized).');
        console.warn('Try running: npx prisma db push && npx tsx scripts/refresh-rfm-view.ts');
    }

    console.info('\n🎉 Portfolio mock data seeding completed successfully!');
    console.info('=====================================================');
    console.info('Client Email: portfolio@example.com');
    console.info('Password: Portfolio123!');
    console.info('=====================================================');

  } catch (error) {
    console.error('💥 Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
