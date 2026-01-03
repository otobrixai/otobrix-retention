// scripts/smoke/rate-limit-test.js

async function runRateLimitTest() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  // Test a public endpoint that might have rate limiting
  const testEndpoints = [
    `${baseUrl}/api/csrf-token`,
  ];
  
  console.warn('🚀 Starting rate limit smoke test...');
  
  for (const testEndpoint of testEndpoints) {
    console.warn(`Testing rate limiting on: ${testEndpoint}`);
    console.warn('Making rapid requests to trigger rate limit...');
    
    const requests = [];
    const requestCount = 20;
    
    for (let i = 0; i < requestCount; i++) {
      requests.push(
        fetch(testEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(async (response) => ({
          index: i + 1,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        }))
      );
    }
    
    const results = await Promise.allSettled(requests);
    
    let rateLimitedCount = 0;
    let lastRateLimitHeaders = null;
    
    console.warn('Results:');
    console.warn('--------');
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { index, status, headers } = result.value;
        
        if (status === 429) {
          rateLimitedCount++;
          lastRateLimitHeaders = headers;
          console.warn(`Request ${index}: ❌ 429 Rate Limited`);
        } else if (status === 200) {
          console.warn(`Request ${index}: ✅ ${status}`);
        } else {
          console.warn(`Request ${index}: ⚠️ ${status}`);
        }
      } else {
        console.error(`Request failed: ${result.reason.message}`);
      }
    }
    
    console.warn(`📊 Summary for ${testEndpoint}:`);
    console.warn(`   Rate Limited: ${rateLimitedCount}`);
    console.warn(`   Total: ${requestCount}`);
    
    if (lastRateLimitHeaders) {
      console.warn('📋 Rate limit headers from 429 response:');
      console.warn(`   X-RateLimit-Limit: ${lastRateLimitHeaders['x-ratelimit-limit'] || 'Not found'}`);
      console.warn(`   X-RateLimit-Remaining: ${lastRateLimitHeaders['x-ratelimit-remaining'] || 'Not found'}`);
      console.warn(`   X-RateLimit-Reset: ${lastRateLimitHeaders['x-ratelimit-reset'] || 'Not found'}`);
      
      const remaining = parseInt(lastRateLimitHeaders['x-ratelimit-remaining'] || '0');
      if (remaining === 0) {
        console.warn('✅ Rate limit test PASSED: Got 429 with X-RateLimit-Remaining: 0');
        console.warn('RATE_LIMIT_OK');
        return;
      }
    }
  }
  
  console.warn('⚠️ Rate limit test: No rate limiting detected');
  console.warn('RATE_LIMIT_NO_TRIGGER');
}

// Call the function
runRateLimitTest().catch(error => {
  console.error('Rate limit test failed:', error);
  process.exit(1);
});