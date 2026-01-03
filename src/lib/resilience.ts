// src/lib/resilience.ts - Resilience patterns for external calls
import { instrument } from './otel';

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  factor: number;
  jitter: boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
  baseDelay: parseInt(process.env.RETRY_BASE_DELAY_MS || '100'),
  maxDelay: parseInt(process.env.RETRY_MAX_DELAY_MS || '30000'),
  factor: parseFloat(process.env.RETRY_BACKOFF_FACTOR || '2'),
  jitter: process.env.RETRY_JITTER !== 'false',
};

// Circuit breaker configuration
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxAttempts: number;
}

const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
  failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
  resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS || '30000'),
  halfOpenMaxAttempts: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_ATTEMPTS || '2'),
};

// Circuit breaker state
interface CircuitState {
  failures: number;
  lastFailure: number | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  halfOpenAttempts: number;
}

class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState;
  private name: string;

  constructor(name: string, config: CircuitBreakerConfig = defaultCircuitBreakerConfig) {
    this.name = name;
    this.config = config;
    this.state = {
      failures: 0,
      lastFailure: null,
      state: 'CLOSED',
      halfOpenAttempts: 0,
    };
  }

  canExecute(): boolean {
    const now = Date.now();
    
    if (this.state.state === 'OPEN') {
      // Check if reset timeout has passed
      if (this.state.lastFailure && 
          now - this.state.lastFailure > this.config.resetTimeout) {
        this.state.state = 'HALF_OPEN';
        this.state.halfOpenAttempts = 0;
        console.warn(`[CIRCUIT] ${this.name}: Transitioned to HALF_OPEN`);
        return true;
      }
      return false;
    }
    
    return true;
  }

  onSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.halfOpenAttempts++;
      if (this.state.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.reset();
        console.warn(`[CIRCUIT] ${this.name}: Success in HALF_OPEN, reset to CLOSED`);
      }
    } else {
      this.state.failures = Math.max(0, this.state.failures - 1);
    }
  }

  onFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();
    
    if (this.state.state === 'HALF_OPEN') {
      this.state.state = 'OPEN';
      console.error(`[CIRCUIT] ${this.name}: Failed in HALF_OPEN, back to OPEN`);
    } else if (this.state.failures >= this.config.failureThreshold) {
      this.state.state = 'OPEN';
      console.error(`[CIRCUIT] ${this.name}: Threshold reached, opening circuit`);
    }
  }

  reset(): void {
    this.state = {
      failures: 0,
      lastFailure: null,
      state: 'CLOSED',
      halfOpenAttempts: 0,
    };
  }

  getState(): CircuitState {
    return { ...this.state };
  }
}

// Store circuit breakers by service
const circuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(serviceName: string): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker(serviceName));
  }
  return circuitBreakers.get(serviceName)!;
}

// Exponential backoff with jitter
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.factor, attempt - 1);
  const cappedDelay = Math.min(delay, config.maxDelay);
  
  if (config.jitter) {
    // Add ±20% jitter
    const jitter = 0.2;
    const jitterAmount = cappedDelay * jitter;
    return cappedDelay - jitterAmount + Math.random() * 2 * jitterAmount;
  }
  
  return cappedDelay;
}

// Retry with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  serviceName: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  const circuitBreaker = getCircuitBreaker(serviceName);
  
  return instrument(`resilience.retry.${serviceName}`, async () => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      // Check circuit breaker
      if (!circuitBreaker.canExecute()) {
        throw new Error(`Circuit breaker OPEN for ${serviceName}`);
      }
      
      try {
        const result = await fn();
        circuitBreaker.onSuccess();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        circuitBreaker.onFailure();
        
        // Log retry attempt
        console.warn(`[RESILIENCE] ${serviceName}: Attempt ${attempt}/${finalConfig.maxAttempts} failed:`, lastError.message);
        
        // Don't wait after the last attempt
        if (attempt < finalConfig.maxAttempts) {
          const delay = calculateDelay(attempt, finalConfig);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All attempts failed
    console.error(`[RESILIENCE] ${serviceName}: All ${finalConfig.maxAttempts} attempts failed`);
    throw lastError!;
  }, );
}

// Wrapper for Redis operations
export async function withRedisRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, 'redis', {
    maxAttempts: 2,
    baseDelay: 50,
    factor: 2,
  });
}

// Wrapper for Resend email operations
export async function withResendRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, 'resend', {
    maxAttempts: 3,
    baseDelay: 100,
    factor: 3,
  });
}

// Wrapper for external API calls
export async function withExternalApiRetry<T>(service: string, fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, `external.${service}`, {
    maxAttempts: 2,
    baseDelay: 200,
    factor: 2,
  });
}

// Safe execution with timeout
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  fallback?: () => Promise<T>
): Promise<T> {
  return instrument('resilience.timeout', async () => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
      });
      
      return await Promise.race([fn(), timeoutPromise]);
    } catch (error) {
      // If we have a fallback, use it
      if (fallback) {
        console.warn(`[RESILIENCE] Timeout occurred, using fallback:`, error instanceof Error ? error.message : String(error));
        return await fallback();
      }
      
      // Otherwise re-throw
      if (error instanceof Error) {
        error.message = `Timeout: ${error.message}`;
      }
      throw error;
    }
  });
}

// Get circuit breaker states for monitoring
export function getCircuitBreakerStates(): Record<string, CircuitState> {
  const states: Record<string, CircuitState> = {};
  for (const [name, breaker] of circuitBreakers.entries()) {
    states[name] = breaker.getState();
  }
  return states;
}

// Example usage in cache manager (update your existing cache manager)
export function createResilientCacheWrapper() {
  return {
    async get<T>(_key: string): Promise<T | null> {
      return withRedisRetry(async () => {
        // Your existing cache get logic here
        const result = null; // Replace with actual cache get
        return result;
      });
    },
    
    async set(_key: string, _value: unknown, _ttl?: number): Promise<boolean> {
      return withRedisRetry(async () => {
        // Your existing cache set logic here
        return true;
      });
    },
  };
}

export default {
  withRetry,
  withRedisRetry,
  withResendRetry,
  withExternalApiRetry,
  withTimeout,
  getCircuitBreakerStates,
};