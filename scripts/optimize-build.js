// scripts/optimize-build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting build optimization...\n');

// 1. Analyze bundle size
console.log('1. Analyzing bundle size...');
try {
  execSync('cross-env ANALYZE=true npm run build', { stdio: 'inherit' });
} catch (error) {
  console.log('Bundle analyzer completed (may show warnings)');
}

// 2. Check for large dependencies
console.log('\n2. Checking for large dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  console.log('Top dependencies by likely size:');
  const largeDeps = [
    'react-dom', '@sentry/nextjs', 'prisma', '@prisma/client', 
    'recharts', 'lucide-react', '@radix-ui'
  ];
  
  largeDeps.forEach(dep => {
    if (Object.keys(deps).some(d => d.includes(dep))) {
      console.log(`  - ${dep}: included`);
    }
  });
} catch (error) {
  console.log('Could not analyze dependencies');
}

// 3. Generate build report
console.log('\n3. Generating build report...');
try {
  const buildOutput = execSync('npm run build 2>&1 | tail -50', { 
    encoding: 'utf8',
    shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
  });
  
  const reportFile = path.join(process.cwd(), 'build-report.txt');
  fs.writeFileSync(reportFile, buildOutput);
  console.log(`Build report saved to: ${reportFile}`);
  
  // Extract key metrics
  const lines = buildOutput.split('\n');
  const sizeLine = lines.find(l => l.includes('First Load JS'));
  const pageLines = lines.filter(l => l.includes('○') || l.includes('●') || l.includes('λ'));
  
  console.log('\nKey Build Metrics:');
  if (sizeLine) console.log(sizeLine.trim());
  console.log(`\nPage Routes: ${pageLines.length}`);
  
} catch (error) {
  console.log('Could not generate build report');
}

// 4. Check image optimization
console.log('\n4. Checking image optimization...');
const publicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  const images = fs.readdirSync(publicDir)
    .filter(f => /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(f));
  
  console.log(`Found ${images.length} images in /public`);
  
  if (images.length > 0) {
    console.log('Consider:');
    console.log('  - Converting to WebP/AVIF format');
    console.log('  - Using next/image for automatic optimization');
    console.log('  - Lazy loading off-screen images');
  }
}

console.log('\n✅ Build optimization check complete!');
console.log('\nRecommended next steps:');
console.log('1. Run: npm run analyze (to view bundle analysis)');
console.log('2. Run: npm run build --profile (for React profiling)');
console.log('3. Deploy to Vercel for production optimization');