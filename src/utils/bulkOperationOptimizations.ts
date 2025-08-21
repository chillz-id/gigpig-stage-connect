// Bulk operation performance optimizations
import { Invoice } from '@/types/invoice';

// Cache for invoice data during bulk operations
class InvoiceCache {
  private cache: Map<string, Invoice> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes
  private timestamps: Map<string, number> = new Map();

  set(invoiceId: string, invoice: Invoice): void {
    this.cache.set(invoiceId, invoice);
    this.timestamps.set(invoiceId, Date.now());
  }

  get(invoiceId: string): Invoice | null {
    const timestamp = this.timestamps.get(invoiceId);
    if (!timestamp || Date.now() - timestamp > this.ttl) {
      this.cache.delete(invoiceId);
      this.timestamps.delete(invoiceId);
      return null;
    }
    return this.cache.get(invoiceId) || null;
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Batch queue for optimizing database operations
export class BatchQueue<T> {
  private queue: T[] = [];
  private batchSize: number;
  private flushInterval: number;
  private flushCallback: (items: T[]) => Promise<void>;
  private timer: number | null = null;

  constructor(
    batchSize: number,
    flushInterval: number,
    flushCallback: (items: T[]) => Promise<void>
  ) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.flushCallback = flushCallback;
  }

  add(item: T): void {
    this.queue.push(item);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = window.setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const items = [...this.queue];
    this.queue = [];

    try {
      await this.flushCallback(items);
    } catch (error) {
      // Re-add items to queue on error
      this.queue.unshift(...items);
      throw error;
    }
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// Rate limiter for external API calls
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = refillRate;
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Calculate wait time
    const tokensNeeded = tokens - this.tokens;
    const waitTime = (tokensNeeded / this.refillRate) * 1000;

    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    this.refill();
    this.tokens -= tokens;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Export singleton instances
export const invoiceCache = new InvoiceCache();

// Create a rate limiter for email operations (10 emails per second)
export const emailRateLimiter = new RateLimiter(10, 10);

// Create a rate limiter for PDF generation (5 per second)
export const pdfRateLimiter = new RateLimiter(5, 5);

// Helper function to chunk array for batch processing
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Helper function for parallel processing with concurrency control
export async function processInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(0, executing.findIndex(p => p === promise) + 1);
    }
  }

  await Promise.all(executing);
  return results;
}

// Progress throttling to avoid too many updates
export class ProgressThrottler {
  private lastUpdate: number = 0;
  private minInterval: number;

  constructor(minInterval: number = 100) {
    this.minInterval = minInterval;
  }

  shouldUpdate(): boolean {
    const now = Date.now();
    if (now - this.lastUpdate >= this.minInterval) {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }

  forceUpdate(): void {
    this.lastUpdate = 0;
  }
}