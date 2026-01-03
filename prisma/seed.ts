// prisma/seed.ts - SECURE VERSION
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

// If .env.local doesn't exist or doesn't have DATABASE_URL, try .env
if (!process.env.DATABASE_URL) {
  config();
}

async function main() {
  console.info('🌱 Starting database seed...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.error('Please check your .env.local or .env file');
    process.exit(1);
  }
  
  const adminInitPassword = process.env.ADMIN_INIT_PASSWORD;
  
  try {
    // Create PostgreSQL connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Create the PostgreSQL adapter
    const adapter = new PrismaPg(pool);
    
    // Create PrismaClient with the adapter
    const prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['info', 'warn', 'error'] : ['error'],
    });
    
    // Seed admin user if password is provided
    if (adminInitPassword) {
      await seedAdminUser(prisma, adminInitPassword);
    } else {
      console.warn('⚠️  ADMIN_INIT_PASSWORD not set - skipping admin user creation');
      // Continue with sample client seeding even if admin not created
    }

    // Seed sample client and client user
    await seedSampleClient(prisma);
    
    console.info('🎉 Seed completed successfully!');

  } catch (error: unknown) {
    console.error('❌ Error during seeding:', error instanceof Error ? error.message : String(error));
    
    // Provide helpful debugging info
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('connection refused')) {
      console.error('Cannot connect to PostgreSQL. Make sure it\'s running:');
      console.error('  Check if PostgreSQL is installed and running on localhost:5432');
      console.error('  For Windows, try: "services.msc" and start PostgreSQL service');
    } else if (errorMessage.includes('does not exist')) {
      console.error('Database or schema may not exist. Try running:');
      console.error('  npx prisma db push');
    } else if (errorMessage.includes('password authentication failed')) {
      console.error('Password authentication failed. Check your DATABASE_URL credentials');
    }
    
    process.exit(1);
  }
}

async function seedAdminUser(prisma: PrismaClient, password: string) {
  try {
    console.info('🔐 Creating admin user...');
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    
    const adminUser = await prisma.admin_users.upsert({
      where: { email: 'admin@otobrixai.com' },
      update: {
        password_hash: passwordHash,
        is_active: true,
        role: 'superadmin',
        updated_at: now,
      },
      create: {
        email: 'admin@otobrixai.com',
        password_hash: passwordHash,
        role: 'superadmin',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    });

    console.info('✅ Admin user created/updated:', adminUser.email);
    console.info('   Email:', adminUser.email);
    console.info('   Role:', adminUser.role);
    console.info('   Created at:', adminUser.created_at.toISOString());
    
  } catch (error: unknown) {
    console.error('❌ Error creating admin user:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function seedSampleClient(prisma: PrismaClient) {
  try {
    console.info('🏢 Creating sample client...');
    const now = new Date();
    
    // Create or update the client
    const sampleClient = await prisma.clients.upsert({
      where: { email: 'client@example.com' },
      update: {
        client_name: 'Sample Client',
        company_name: 'Sample Client Company',
        status: 'active',
        updated_at: now,
      },
      create: {
        email: 'client@example.com',
        client_name: 'Sample Client',
        company_name: 'Sample Client Company',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    });

    console.info('✅ Sample client created/updated:', sampleClient.email);
    console.info('   Client ID:', sampleClient.client_id);
    console.info('   Company:', sampleClient.company_name);
    console.info('   Status:', sampleClient.status);

    // Create the client user with a secure password
    const clientPassword = process.env.CLIENT_INIT_PASSWORD || 'generate-secure-password-in-production';
    const clientPasswordHash = await bcrypt.hash(clientPassword, 12);
    
    const clientUser = await prisma.client_users.upsert({
      where: { 
        client_id_email: {
          client_id: sampleClient.client_id,
          email: sampleClient.email
        }
      },
      update: {
        password_hash: clientPasswordHash,
        is_active: true,
        updated_at: now,
      },
      create: {
        client_id: sampleClient.client_id,
        email: sampleClient.email,
        password_hash: clientPasswordHash,
        role: 'client',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    });
    
    console.info('✅ Client user created/updated:', clientUser.email);
    console.info('   Email:', clientUser.email);
    console.info('   Role:', clientUser.role);
    console.info('   Active:', clientUser.is_active);
    
    console.info('\n📋 Login Credentials:');
    console.info('=====================');
    console.info('Admin:');
    console.info('  Email: admin@otobrixai.com');
    console.info('  Password: (from ADMIN_INIT_PASSWORD in .env.local)');
    console.info('\nClient:');
    console.info('  Email: client@example.com');
    console.info('  Password: (from CLIENT_INIT_PASSWORD in .env.local)');
    console.warn('\n⚠️  IMPORTANT: Change these passwords in production!');
    
  } catch (error: unknown) {
    console.error('❌ Error creating sample client:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

main()
  .then(() => {
    console.info('\n✨ Database seeding completed successfully!');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('💥 Seed failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });