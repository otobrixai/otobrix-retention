// Performance monitoring utilities
export class PerformanceTracker {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }

  end(): number {
    const duration = Date.now() - this.startTime;
    
    if (duration > 1000) {
      console.warn(`[performance] ${this.operation} took ${duration}ms`);
    }
    
    return duration;
  }

  static async track<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const tracker = new PerformanceTracker(operation);
    try {
      const result = await fn();
      tracker.end();
      return result;
    } catch (error) {
      tracker.end();
      throw error;
    }
  }
}

// API timeout utility
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback?: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        if (fallback !== undefined) {
          console.warn(`[timeout] Operation timed out after ${timeoutMs}ms, using fallback`);
          return fallback;
        }
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs)
    )
  ]);
}