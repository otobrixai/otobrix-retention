# Monitoring & Health Checks

## Health Endpoints

### Quick Health Check (`/api/health`)

- Edge runtime compatible
- Returns basic service status
- Response time < 100ms
- Returns 200 OK with timestamp when healthy

### Full Health Check (`/api/health/full`)

- Node runtime required
- Includes:
  - Database connection status
  - Redis cache status
  - Memory usage
  - Uptime
  - Active connections
- Returns detailed JSON with component health status

## Metrics Endpoint

### Prometheus Metrics (`/api/metrics`)

- Exposes metrics in Prometheus format
- Available counters:
  - `otobrix_requests_total` - Total HTTP requests
  - `otobrix_cache_hits_total` - Redis cache hits
  - `otobrix_rate_limited_total` - Rate-limited requests

### System Metrics

- Memory usage (heap, RSS)
- Uptime in seconds
- Active database connections
- Redis connection status
- CPU usage percentage

## Error Tracking

### Sentry Integration

- Real-time error tracking
- Performance monitoring
- User feedback collection
- Release tracking
- Source map upload for minified code

### Error Categories

- JavaScript errors (client-side)
- API failures (server-side)
- Database errors
- Third-party service failures
- Network timeouts

## Performance Monitoring

### Vercel Analytics

- Web Vitals tracking (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Performance insights by region
- API route performance

### Custom Performance Metrics

- API response times (p95, p99)
- Database query performance
- Cache hit ratios
- External service latency
- Authentication request times

## Alerting Configuration

### Sentry Alerts

- Error frequency thresholds
- New issue detection
- Regression alerts
- Performance degradation

### Health Check Alerts

- Service downtime
- Database connection failures
- High memory usage
- Increased error rates

### Uptime Monitoring

- External uptime checkers
- SSL certificate expiration
- Domain expiration monitoring
