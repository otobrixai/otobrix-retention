// scripts/smoke/run-all.js
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

async function runAllSmokeTests() {
  console.warn('🚀 Running all smoke tests...\n');
  
  // Get all smoke test files
  const smokeDir = join(process.cwd(), 'scripts', 'smoke');
  const files = await readdir(smokeDir);
  const testFiles = files.filter(f => f.endsWith('.js') && f !== 'run-all.js');
  
  console.warn(`Found ${testFiles.length} smoke tests\n`);
  
  const testResults = [];
  const env = {
    ...process.env,
    TEST_BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'test',
  };
  
  for (const testFile of testFiles) {
    console.warn(`📋 Running: ${testFile}`);
    console.warn('─'.repeat(50));
    
    try {
      const { stdout, stderr } = await execAsync(`node ${join(smokeDir, testFile)}`, { env });
      
      if (stdout) console.warn(stdout);
      if (stderr) console.error('Stderr:', stderr);
      
      // Determine result based on output
      let passed = false;
      if (stdout.includes('TEST_PASSED') || stdout.includes('_OK') || stdout.includes('COMPLETED')) {
        passed = true;
      } else if (stdout.includes('TEST_FAILED') || stdout.includes('FAILED') || stderr.includes('FAILED')) {
        passed = false;
      } else {
        // Default to passed if no clear failure
        passed = true;
      }
      
      testResults.push({ test: testFile, passed });
      console.warn(`${passed ? '✅' : '❌'} ${testFile}: ${passed ? 'PASSED' : 'FAILED'}\n`);
      
    } catch (error) {
      console.error(`❌ ${testFile}: ERROR - ${error.message}`);
      testResults.push({ test: testFile, passed: false });
    }
  }
  
  // Summary
  console.warn('='.repeat(50));
  console.warn('📊 SMOKE TEST SUMMARY');
  console.warn('='.repeat(50));
  
  const passedCount = testResults.filter(r => r.passed).length;
  
  testResults.forEach(result => {
    console.warn(`${result.passed ? '✅' : '❌'} ${result.test}`);
  });
  
  console.warn(`\n🎯 ${passedCount}/${testFiles.length} tests passed`);
  
  if (passedCount === testFiles.length) {
    console.warn('\n🎉 All smoke tests passed!');
    console.warn('SMOKE_TESTS_ALL_PASSED');
  } else {
    console.warn(`\n⚠️ ${testFiles.length - passedCount} tests failed`);
    console.warn('SMOKE_TESTS_SOME_FAILED');
  }
  
  return passedCount === testFiles.length;
}

// Run
runAllSmokeTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });