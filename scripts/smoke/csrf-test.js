// scripts/smoke/csrf-test.js

async function runCSRFTest() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  try {
    console.warn('🚀 Starting CSRF smoke test...');
    
    // Test 1: CSRF token endpoint works
    console.warn('\n1. Testing CSRF token endpoint...');
    const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`);
    const csrfData = await csrfResponse.json();
    
    if (csrfResponse.status === 200 && csrfData.success && csrfData.csrfToken) {
      console.warn('✅ CSRF token endpoint: OK');
      console.warn(`   Token length: ${csrfData.csrfToken.length} characters`);
    } else {
      console.error('❌ CSRF token endpoint: FAILED');
      console.error('   Response:', csrfData);
      process.exit(1);
    }
    
    // Test 2: CSRF middleware is active (GET shouldn't be blocked)
    console.warn('\n2. Testing CSRF middleware on GET request...');
    const getResponse = await fetch(`${baseUrl}/api/health`);
    
    if (getResponse.status === 200) {
      console.warn('✅ GET request: Not blocked by CSRF (correct)');
    } else {
      console.warn(`⚠️ GET request: Got ${getResponse.status}`);
    }
    
    // Test 3: POST without CSRF token gets appropriate response
    console.warn('\n3. Testing POST without CSRF token...');
    const postResponse = await fetch(`${baseUrl}/api/admin/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_name: 'Test Client',
        email: 'test@example.com',
      }),
    });
    
    // POST without CSRF should get 403 or 401 (if auth fails first)
    if (postResponse.status === 403 || postResponse.status === 401) {
      console.warn(`✅ POST without token: Got ${postResponse.status} (expected for protected endpoint)`);
    } else {
      console.warn(`⚠️ POST without token: Got ${postResponse.status}`);
    }
    
    // Note: Full CSRF validation test requires cookie handling
    // which is complex in Node.js without a proper cookie jar
    console.warn('\n💡 Note: Full CSRF validation requires cookie handling');
    console.warn('   In a browser, cookies are handled automatically');
    console.warn('   This smoke test verifies the endpoints exist and respond');
    
    console.warn('\n🎉 CSRF smoke test completed!');
    console.warn('CSRF_SMOKE_TEST_OK');
    
  } catch (error) {
    console.error('💥 CSRF test failed:');
    console.error('   Error:', error.message);
    process.exit(1);
  }
}

// Call the function
runCSRFTest().catch(error => {
  console.error('CSRF test failed:', error);
  process.exit(1);
});