// scripts/smoke/health-check.js

async function runHealthCheck() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  try {
    console.warn('🚀 Starting health check smoke test...');
    
    // Test 1: Edge health endpoint
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.status === 200 && healthData.status === 'healthy') {
      console.warn('✅ Edge health endpoint: OK');
    } else {
      console.error('❌ Edge health endpoint: FAILED');
      console.error('   Status:', healthResponse.status);
      console.error('   Response:', healthData);
      process.exit(1);
    }
    
    // Test 2: Full health endpoint
    try {
      const fullHealthResponse = await fetch(`${baseUrl}/api/health/full`);
      const fullHealthData = await fullHealthResponse.json();
      
      if (fullHealthResponse.status === 200) {
        console.warn('✅ Full health endpoint: OK');
      } else {
        console.warn('⚠️ Full health endpoint: Degraded');
        console.warn('   Status:', fullHealthData.status);
      }
    } catch (error) {
      console.warn('⚠️ Full health endpoint not available:', error.message);
    }
    
    // Test 3: Metrics endpoint
    const metricsResponse = await fetch(`${baseUrl}/api/metrics`);
    
    if (metricsResponse.status === 200) {
      const metricsText = await metricsResponse.text();
      const hasMetrics = metricsText.includes('otobrix_requests_total');
      
      if (hasMetrics) {
        console.warn('✅ Metrics endpoint: OK');
      } else {
        console.warn('⚠️ Metrics endpoint: Unexpected format');
      }
    } else {
      console.error('❌ Metrics endpoint: FAILED');
      console.error('   Status:', metricsResponse.status);
      process.exit(1);
    }
    
    // Test 4: CSRF token endpoint
    const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`);
    const csrfData = await csrfResponse.json();
    
    if (csrfResponse.status === 200 && csrfData.success && csrfData.csrfToken) {
      console.warn('✅ CSRF token endpoint: OK');
    } else {
      console.error('❌ CSRF token endpoint: FAILED');
      console.error('   Response:', csrfData);
      process.exit(1);
    }
    
    console.warn('🎉 All health checks passed!');
    console.warn('HEALTH_OK');
    
  } catch (error) {
    console.error('💥 Health check failed:');
    console.error('   Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Is the server running?');
      console.error('   Run: pnpm run dev');
      console.error('   Or set TEST_BASE_URL environment variable');
    }
    
    process.exit(1);
  }
}

runHealthCheck().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});