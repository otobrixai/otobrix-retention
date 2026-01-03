// validate-changes.mjs - ES MODULE VERSION
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.warn('🔍 Validating premium-ready changes...\n');

try {
  // 1. Check build
  console.warn('1. Testing build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.warn('✅ Build successful\n');

  // 2. Check TypeScript
  console.warn('2. Checking TypeScript...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.warn('✅ TypeScript checks passed\n');

  // 3. Verify no plaintext passwords in seed
  console.warn('3. Checking for plaintext passwords...');
  const seedContent = readFileSync('./prisma/seed.ts', 'utf8');
  if (seedContent.includes('console.log(`🔑 Password:') || seedContent.includes('password123')) {
    console.error('❌ Plaintext password logging found in seed');
    process.exit(1);
  }
  console.warn('✅ No plaintext password logging\n');

  console.warn('🎉 All validations passed! The app is premium-ready.');
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}