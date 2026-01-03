// src/lib/queue/index.ts
// Queue is intentionally DISABLED for production stability and performance

interface JobData {
  type: string;
  payload: unknown;
  id?: string;
  timestamp?: number;
}

interface QueueAdapter {
  enqueue(job: JobData): Promise<string>;
  process(handler: (job: JobData) => Promise<void>): void;
  shutdown(): Promise<void>;
}

// No-op queue implementation
class DisabledQueue implements QueueAdapter {
  async enqueue(_job: JobData): Promise<string> {
    // Intentionally do nothing
    return 'queue-disabled';
  }

  process(_handler: (job: JobData) => Promise<void>): void {
    // No background processing
  }

  async shutdown(): Promise<void> {
    // Nothing to clean up
  }
}

// Always export disabled queue
export const queue: QueueAdapter = new DisabledQueue();

export type { JobData, QueueAdapter };
