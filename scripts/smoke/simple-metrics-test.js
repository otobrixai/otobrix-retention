// scripts/smoke/simple-metrics-test.js
// Simple test that definitely outputs something

async function testMetrics() {
  console.warn('🧪 Starting simple metrics test...');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const metricsUrl = `${baseUrl}/api/metrics`;
  
  console.warn(`📡 Testing: ${metricsUrl}`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(metricsUrl, {
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    console.warn(`📊 Status: ${response.status}`);
    
    if (response.status === 200) {
      const body = await response.text();
      console.warn('✅ Metrics endpoint works!');
      console.warn(`📝 Response length: ${body.length} characters`);
      
      // Check if it looks like Prometheus metrics
      if (body.includes('otobrix_')) {
        console.warn('✅ Found otobrix metrics!');
        console.warn('🎉 TEST PASSED');
        return true;
      } else {
        console.error('❌ Response does not contain otobrix metrics');
        console.error('Sample:', body.substring(0, 200));
        return false;
      }
    } else {
      console.error(`❌ Failed: Status ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
    
    if (error.name === 'AbortError') {
      console.error('Request timed out after 5 seconds');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - is the server running?');
      console.error('Run: npm run dev');
    }
    
    return false;
  }
}

// Run test
testMetrics()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });