// scripts/smoke/test-metrics.js
// Using Node.js built-in fetch (available in Node 18+)

// Custom logger that only uses allowed console methods
const logger = {
  info: (...args) => {
    console.warn(...args);
  },
  
  error: (...args) => {
    console.error(...args);
  },
  
  success: (...args) => {
    console.warn(...args);
  }
};

async function testMetricsEndpoint() {
  logger.info('🧪 Testing metrics endpoint...\n');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const metricsUrl = `${baseUrl}/api/metrics`;
  
  try {
    logger.info(`📡 Making request to: ${metricsUrl}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(metricsUrl, {
      headers: {
        'User-Agent': 'otobrix-smoke-test/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    logger.info(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    // Check headers
    const contentType = response.headers.get('content-type');
    logger.info(`📋 Content-Type: ${contentType}`);
    
    // Check cache control
    const cacheControl = response.headers.get('cache-control');
    logger.info(`💾 Cache-Control: ${cacheControl}`);
    
    const body = await response.text();
    
    if (response.status === 200) {
      logger.success('\n✅ Metrics endpoint is accessible');
      
      // Parse and validate metrics format
      const lines = body.split('\n').filter(line => line.trim());
      
      // Count metric types
      const helpLines = lines.filter(line => line.startsWith('# HELP'));
      const typeLines = lines.filter(line => line.startsWith('# TYPE'));
      const metricLines = lines.filter(line => !line.startsWith('#'));
      
      logger.info(`\n📈 Metrics Summary:`);
      logger.info(`   Total lines: ${lines.length}`);
      logger.info(`   HELP lines: ${helpLines.length}`);
      logger.info(`   TYPE lines: ${typeLines.length}`);
      logger.info(`   Metric lines: ${metricLines.length}`);
      
      // Check for required metrics
      const requiredMetrics = [
        'otobrix_requests_total',
        'otobrix_cache_hits_total',
        'otobrix_cache_misses_total',
        'otobrix_errors_total',
        'otobrix_memory_rss_bytes',
        'otobrix_uptime_seconds',
      ];
      
      logger.info(`\n🔍 Checking for required metrics:`);
      
      let allMetricsFound = true;
      for (const metric of requiredMetrics) {
        const found = lines.some(line => line.includes(metric));
        const status = found ? '✅' : '❌';
        logger.info(`   ${status} ${metric}`);
        if (!found) allMetricsFound = false;
      }
      
      // Show sample metrics
      logger.info(`\n📄 Sample metrics (first 5):`);
      metricLines.slice(0, 5).forEach((line, i) => {
        logger.info(`   ${i + 1}. ${line}`);
      });
      
      if (allMetricsFound) {
        logger.success('\n🎉 METRICS_TEST_PASSED: All required metrics found');
        return true;
      } else {
        logger.error('\n⚠️  METRICS_TEST_WARNING: Some metrics missing');
        return false;
      }
      
    } else {
      logger.error(`\n❌ METRICS_TEST_FAILED: Unexpected status ${response.status}`);
      logger.error(`Response body: ${body}`);
      return false;
    }
    
  } catch (error) {
    logger.error(`\n💥 METRICS_TEST_ERROR: ${error.message}`);
    
    if (error.name === 'AbortError') {
      logger.error('Request timed out after 10 seconds');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('\n⚠️  Is the server running? Start with: npm run dev');
      logger.error(`   Expected server at: ${baseUrl}`);
    } else {
      logger.error('Stack:', error.stack);
    }
    
    return false;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testMetricsEndpoint()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { testMetricsEndpoint };