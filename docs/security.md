# Security, Observability & Resilience

## Overview

Security hardening, observability, and resilience enhancements implemented to ensure production readiness.

## Security Enhancements

### CSRF Protection

- Strict enforcement on all POST/PUT/DELETE/PATCH endpoints
- Removed `DISABLE_CSRF` bypass flag
- Added `/api/csrf-token` endpoint
- Constant-time token comparison to prevent timing attacks

### Security Headers

Updated `middleware.ts` with:

- Content-Security-Policy (CSP) with environment-specific rules
- Strict-Transport-Security (HSTS) in production
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Permissions-Policy restrictions
- Referrer-Policy: strict-origin-when-cross-origin

### Session Management

- Strict 5-minute expiration buffer
- Production-mode validation enforcement
- Session freshness checks for sensitive operations

## Rate Limiting & Abuse Protection

### Rate Limit Headers

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### Rate Limit Configuration

- Admin API key bypass with strict validation
- Per-endpoint limits configurable via environment variables

## Observability

### Sentry Integration

- Client, server, and edge configurations
- Error filtering for monitoring endpoints
- Environment tagging

### OpenTelemetry

- Lightweight wrapper implementation
- Non-blocking tracer
- Graceful degradation when OTEL not configured
- Instruments dashboard data and cache operations

### Metrics Endpoint (`/api/metrics`)

- Prometheus-friendly format
- Counters: `otobrix_requests_total`, `otobrix_cache_hits_total`, `otobrix_rate_limited_total`
- System metrics: memory, uptime, connection status

### Health Endpoints

- `/api/health` (Edge runtime)
- `/api/health/full` (Node runtime)
- Cache, database, and memory metrics

## Resilience Patterns

### Retry with Backoff

- Exponential backoff with jitter for external calls

### Circuit Breaker

- Failure threshold tracking to prevent cascading failures

### Timeout Wrappers

- Configurable timeouts for external service calls

### Safe Fallbacks

- Fail-open behavior with comprehensive logging

## Environment Variables

## Security

NEXT_PUBLIC_APP_URL=<http://localhost:3000>  # For CSRF origin validation
ADMIN_API_KEY=your-secret-key-here         # For rate limit bypass

## Observability Environment Variables

SENTRY_DSN=your-sentry-dsn-here            # Sentry error tracking
OTEL_EXPORTER_OTLP_ENDPOINT=<http://localhost:4318>  # OpenTelemetry
OTEL_SERVICE_NAME=otobrix-retention

## Rate Limiting

RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

## Resilience

RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY_MS=100
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5

## Smoke Tests

All security, observability, and resilience features have been validated with passing smoke tests.
