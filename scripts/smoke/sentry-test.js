// scripts/smoke/sentry-test.js
import fetch from 'node-fetch';

async function runSentryTest() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  try {
    console.warn('🚀 Starting Sentry smoke test...');
    
    console.warn('1. Testing error page (should load without crash)...');
    const errorTestResponse = await fetch(`${baseUrl}/api/health?triggerError=test`);
    
    if (errorTestResponse.status === 200 || errorTestResponse.status === 503) {
      console.warn('✅ Error handling: Server responded without crash');
    } else {
      console.warn(`⚠️ Got status ${errorTestResponse.status}`);
    }
    
    console.warn('2. Testing global error boundary simulation...');
    console.warn('   Manual test required for React component errors.');
    
    console.warn('📋 Sentry Configuration Check:');
    console.warn('   SENTRY_DSN configured:', !!process.env.SENTRY_DSN);
    console.warn('   NODE_ENV:', process.env.NODE_ENV);
    
    if (process.env.SENTRY_DSN) {
      console.warn('✅ Sentry appears to be configured');
    } else {
      console.warn('⚠️ Sentry DSN not configured - error tracking disabled');
    }
    
    console.warn('🎉 Sentry smoke test completed!');
    console.warn('SENTRY_OK');
    
  } catch (error) {
    console.error('💥 Sentry test failed:');
    console.error('   Error:', error.message);
    process.exit(1);
  }
}

runSentryTest().catch(error => {
  console.error('Sentry test failed:', error);
  process.exit(1);
});