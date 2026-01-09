# Sentry Integration

## Setup

### Environment Variables

Add to your `.env.local`:

SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

## Configuration

### Client-Side Setup

- Automatic error boundary integration
- Performance monitoring for web vitals
- User session tracking
- Release health monitoring
- Source map upload during build

### Server-Side Setup

- API route error tracking
- Server component error capture
- Custom error contexts
- Breadcrumb recording
- Request/response tracing

### Edge Runtime Support

- Edge middleware error tracking
- Lightweight error reporting
- Minimal performance impact
- Environment-specific configurations

## Features

### Error Filtering

- Filter out monitoring endpoint errors
- Ignore expected client-side errors
- Focus on actionable errors
- Custom error grouping rules

### Environment Tagging

- Production vs development
- Staging environment support
- Release version tracking
- Commit SHA integration

### Performance Monitoring

- Transaction tracing
- Slow operation detection
- Bottleneck identification
- User flow tracking

## Best Practices

1. **Context Enrichment**: Add user context, tags, and extra data
2. **Error Grouping**: Configure fingerprinting for similar errors
3. **Release Tracking**: Integrate with your CI/CD pipeline
4. **Alert Rules**: Set up notifications for critical errors
5. **Source Maps**: Upload source maps for readable stack traces

## Troubleshooting

### Common Issues

#### 1. Missing Source Maps

Build with source maps:

pnpm run build

Upload source maps to Sentry:

npx @sentry/cli sourcemaps inject
npx @sentry/cli sourcemaps upload

#### 2. Missing Errors

Check Sentry DSN configuration

echo $SENTRY_DSN

Verify Sentry is initialized

Check browser console for Sentry initialization logs

#### 3. Performance Impact

Disable Sentry in development

if (process.env.NODE_ENV === 'production') {
  Sentry.init({...})
}

#### 4. Too Many Errors

Configure sampling rate

Sentry.init({
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

#### 5. Environment Mismatch

Verify environment tags

SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=version-1.0.0
