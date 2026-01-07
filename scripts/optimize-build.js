// scripts/optimize-build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.info('🔧 Starting build optimization...\n');

// 1. Analyze bundle size
console.info('1. Analyzing bundle size...');
try {
  execSync('cross-env ANALYZE=true npm run build', { stdio: 'inherit' });
// eslint-disable-next-line no-unused-vars
} catch (error) {
  console.info('Bundle analyzer completed (may show warnings)');
}

// 2. Check for large dependencies
console.info('\n2. Checking for large dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  console.info('Top dependencies by likely size:');
  const largeDeps = [
    'react-dom', '@sentry/nextjs', 'prisma', '@prisma/client', 
    'recharts', 'lucide-react', '@radix-ui'
  ];
  
  largeDeps.forEach(dep => {
    if (Object.keys(deps).some(d => d.includes(dep))) {
      console.info(`  - ${dep}: included`);
    }
  });
// eslint-disable-next-line no-unused-vars
} catch (error) {
  console.info('Could not analyze dependencies');
}

// 3. Generate build report
console.info('\n3. Generating build report...');
try {
  const buildOutput = execSync('npm run build 2>&1 | tail -50', { 
    encoding: 'utf8',
    shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
  });
  
  const reportFile = path.join(process.cwd(), 'build-report.txt');
  fs.writeFileSync(reportFile, buildOutput);
  console.info(`Build report saved to: ${reportFile}`);
  
  // Extract key metrics
  const lines = buildOutput.split('\n');
  const sizeLine = lines.find(l => l.includes('First Load JS'));
  const pageLines = lines.filter(l => l.includes('○') || l.includes('●') || l.includes('λ'));
  
  console.info('\nKey Build Metrics:');
  if (sizeLine) console.info(sizeLine.trim());
  console.info(`\nPage Routes: ${pageLines.length}`);
  
// eslint-disable-next-line no-unused-vars
} catch (error) {
  console.info('Could not generate build report');
}

// 4. Check image optimization
console.info('\n4. Checking image optimization...');
const publicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  const images = fs.readdirSync(publicDir)
    .filter(f => /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(f));
  
  console.info(`Found ${images.length} images in /public`);
  
  if (images.length > 0) {
    console.info('Consider:');
    console.info('  - Converting to WebP/AVIF format');
    console.info('  - Using next/image for automatic optimization');
    console.info('  - Lazy loading off-screen images');
  }
}

console.info('\n✅ Build optimization check complete!');
console.info('\nRecommended next steps:');
console.info('1. Run: npm run analyze (to view bundle analysis)');
console.info('2. Run: npm run build --profile (for React profiling)');
console.info('3. Deploy to Vercel for production optimization');