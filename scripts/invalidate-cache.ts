// scripts/invalidate-cache.ts
import { invalidateDashboardSnapshot } from '../src/lib/actions/premium-dashboard';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local');
config({ path: envPath });

async function main() {
  const clientId = 'cml7ov8cy0000uolcblfkw0va'; // Portfolio Enterprise ID
  console.info(`🧹 Invalidating cache for client: ${clientId}...`);
  await invalidateDashboardSnapshot(clientId);
  console.info('✅ Cache invalidated.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
