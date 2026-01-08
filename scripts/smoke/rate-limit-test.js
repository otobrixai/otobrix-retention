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
    // Make 101 requests to trigger rate limit (API limit is 100 per 15 minutes)
    const requestCount = 101;
    
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
    
    // Check first few and last few requests for rate limit headers
    const checkRequests = [1, 2, 50, 99, 100, 101];
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { index, status, headers } = result.value;
        
        // Always capture headers from first request to verify middleware is working
        if (index === 1) {
          const hasRateLimitHeaders = headers['x-ratelimit-limit'] || headers['X-RateLimit-Limit'];
          if (hasRateLimitHeaders) {
            console.warn(`✅ Middleware is working - Rate limit headers found on request ${index}`);
            console.warn(`   X-RateLimit-Limit: ${headers['x-ratelimit-limit'] || headers['X-RateLimit-Limit'] || 'Not found'}`);
            console.warn(`   X-RateLimit-Remaining: ${headers['x-ratelimit-remaining'] || headers['X-RateLimit-Remaining'] || 'Not found'}`);
          } else {
            console.warn(`⚠️ Warning: No rate limit headers found - middleware may not be running`);
          }
        }
        
        if (status === 429) {
          rateLimitedCount++;
          lastRateLimitHeaders = headers;
          console.warn(`Request ${index}: ❌ 429 Rate Limited`);
        } else if (checkRequests.includes(index)) {
          // Only log specific requests to reduce output
          const remaining = headers['x-ratelimit-remaining'] || headers['X-RateLimit-Remaining'] || 'N/A';
          console.warn(`Request ${index}: ✅ ${status} (Remaining: ${remaining})`);
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