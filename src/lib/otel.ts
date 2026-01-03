// src/lib/otel.ts — HARD DISABLED (production-safe no-op)

import * as Sentry from '@sentry/nextjs';

interface Span {
  end(): void;
  setAttribute(): void;
  setStatus(): void;
  recordException(): void;
}

interface Tracer {
  startSpan(): Span;
}

const noopSpan: Span = {
  end() {},
  setAttribute() {},
  setStatus() {},
  recordException() {},
};

const noopTracer: Tracer = {
  startSpan() {
    return noopSpan;
  },
};

export async function getTracer(): Promise<Tracer> {
  return noopTracer;
}

export async function instrument<T>(
  _operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (Sentry.getClient()) {
      Sentry.captureException(error);
    }
    throw error;
  }
}

// Metrics remain but are inert
type Metrics = {
  requests: number;
  cacheHits: number;
  cacheMisses: number;
  rateLimited: number;
  errors: number;
  databaseQueries: number;
};

const metrics: Metrics = {
  requests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  rateLimited: 0,
  errors: 0,
  databaseQueries: 0,
};

export const otelMetrics = {
  incrementRequests() {
    metrics.requests++;
  },
  incrementCacheHits() {
    metrics.cacheHits++;
  },
  incrementCacheMisses() {
    metrics.cacheMisses++;
  },
  incrementRateLimited() {
    metrics.rateLimited++;
  },
  incrementErrors() {
    metrics.errors++;
  },
  incrementDatabaseQueries() {
    metrics.databaseQueries++;
  },
  getMetrics(): Metrics {
    return { ...metrics };
  },
  resetMetrics() {
    metrics.requests = 0;
    metrics.cacheHits = 0;
    metrics.cacheMisses = 0;
    metrics.rateLimited = 0;
    metrics.errors = 0;
    metrics.databaseQueries = 0;
  },
};


export function withDashboardInstrumentation<T extends (...args: any[]) => Promise<unknown>>(
  fn: T
): T {
  return fn;
}

export default {
  instrument,
  withDashboardInstrumentation,
  metrics: otelMetrics,
};
