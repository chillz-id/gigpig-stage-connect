// Performance Optimization Service - Caching, optimization, and performance monitoring
import { supabase } from '@/integrations/supabase/client';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  errorRate: number;
  userInteractions: number;
}

export interface OptimizationSettings {
  enableCaching: boolean;
  cacheSize: number;
  prefetchEnabled: boolean;
  compressionEnabled: boolean;
  lazyLoadingEnabled: boolean;
  virtualScrollingEnabled: boolean;
  imageLazyLoading: boolean;
  apiRequestDebounce: number;
}

class PerformanceService {
  private cache = new Map<string, CacheEntry>();
  private maxCacheSize = 100; // Maximum number of cache entries
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    errorRate: 0,
    userInteractions: 0
  };
  private settings: OptimizationSettings = {
    enableCaching: true,
    cacheSize: 100,
    prefetchEnabled: true,
    compressionEnabled: true,
    lazyLoadingEnabled: true,
    virtualScrollingEnabled: true,
    imageLazyLoading: true,
    apiRequestDebounce: 300
  };

  // =====================================
  // CACHING SYSTEM
  // =====================================

  setCache<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    if (!this.settings.enableCaching) return;

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });
  }

  getCache<T>(key: string): T | null {
    if (!this.settings.enableCaching) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update cache hit rate
    this.updateCacheHitRate(true);
    return entry.data as T;
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      // Clear cache entries matching pattern
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  getCacheStats(): { size: number; hitRate: number; entries: string[] } {
    return {
      size: this.cache.size,
      hitRate: this.metrics.cacheHitRate,
      entries: Array.from(this.cache.keys())
    };
  }

  private updateCacheHitRate(hit: boolean): void {
    // Simple hit rate calculation (could be enhanced with more sophisticated tracking)
    const currentRate = this.metrics.cacheHitRate;
    this.metrics.cacheHitRate = hit 
      ? Math.min(currentRate + 0.01, 1) 
      : Math.max(currentRate - 0.01, 0);
  }

  // =====================================
  // API OPTIMIZATION
  // =====================================

  async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      cache?: boolean;
      ttl?: number;
      retry?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { cache = true, ttl = 300000, retry = 3, timeout = 10000 } = options;
    
    // Try cache first
    if (cache) {
      const cached = this.getCache<T>(queryKey);
      if (cached) return cached;
    }

    const startTime = performance.now();
    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        // Timeout wrapper
        const result = await Promise.race([
          queryFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), timeout)
          )
        ]);

        // Cache result
        if (cache) {
          this.setCache(queryKey, result, ttl);
        }

        // Update metrics
        const responseTime = performance.now() - startTime;
        this.updateApiResponseTime(responseTime);

        return result;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retry) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    this.updateErrorRate(true);
    throw lastError;
  }

  // Debounced API calls
  private debounceMap = new Map<string, NodeJS.Timeout>();

  debounceApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    delay: number = this.settings.apiRequestDebounce
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Clear existing timeout
      const existingTimeout = this.debounceMap.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(async () => {
        try {
          const result = await apiCall();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.debounceMap.delete(key);
        }
      }, delay);

      this.debounceMap.set(key, timeout);
    });
  }

  // =====================================
  // QUERY OPTIMIZATION
  // =====================================

  optimizeSupabaseQuery(query: any, options: {
    select?: string;
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
    filters?: Array<{ column: string; operator: string; value: any }>;
  } = {}) {
    let optimizedQuery = query;

    // Optimize select clause
    if (options.select) {
      optimizedQuery = optimizedQuery.select(options.select);
    }

    // Apply filters
    if (options.filters) {
      options.filters.forEach(filter => {
        switch (filter.operator) {
          case 'eq':
            optimizedQuery = optimizedQuery.eq(filter.column, filter.value);
            break;
          case 'neq':
            optimizedQuery = optimizedQuery.neq(filter.column, filter.value);
            break;
          case 'gt':
            optimizedQuery = optimizedQuery.gt(filter.column, filter.value);
            break;
          case 'gte':
            optimizedQuery = optimizedQuery.gte(filter.column, filter.value);
            break;
          case 'lt':
            optimizedQuery = optimizedQuery.lt(filter.column, filter.value);
            break;
          case 'lte':
            optimizedQuery = optimizedQuery.lte(filter.column, filter.value);
            break;
          case 'like':
            optimizedQuery = optimizedQuery.like(filter.column, filter.value);
            break;
          case 'ilike':
            optimizedQuery = optimizedQuery.ilike(filter.column, filter.value);
            break;
          case 'in':
            optimizedQuery = optimizedQuery.in(filter.column, filter.value);
            break;
        }
      });
    }

    // Apply ordering
    if (options.orderBy) {
      optimizedQuery = optimizedQuery.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? true 
      });
    }

    // Apply pagination
    if (options.limit) {
      if (options.offset) {
        optimizedQuery = optimizedQuery.range(options.offset, options.offset + options.limit - 1);
      } else {
        optimizedQuery = optimizedQuery.limit(options.limit);
      }
    }

    return optimizedQuery;
  }

  // =====================================
  // BATCH OPERATIONS
  // =====================================

  async batchRequests<T>(
    requests: Array<() => Promise<T>>,
    batchSize: number = 5,
    delay: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
      
      // Add delay between batches to avoid overwhelming the server
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  // =====================================
  // PREFETCHING
  // =====================================

  private prefetchQueue = new Set<string>();

  async prefetch<T>(
    key: string,
    queryFn: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    if (!this.settings.prefetchEnabled || this.prefetchQueue.has(key)) {
      return;
    }

    this.prefetchQueue.add(key);

    const delay = priority === 'high' ? 0 : priority === 'medium' ? 1000 : 5000;
    
    setTimeout(async () => {
      try {
        const result = await queryFn();
        this.setCache(key, result);
      } catch (error) {
        console.warn(`Prefetch failed for ${key}:`, error);
      } finally {
        this.prefetchQueue.delete(key);
      }
    }, delay);
  }

  // =====================================
  // IMAGE OPTIMIZATION
  // =====================================

  optimizeImageUrl(
    url: string, 
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpg' | 'png';
      fit?: 'cover' | 'contain' | 'fill';
    } = {}
  ): string {
    if (!url) return url;

    // Check if it's a Supabase storage URL
    if (url.includes('supabase')) {
      const params = new URLSearchParams();
      
      if (options.width) params.append('width', options.width.toString());
      if (options.height) params.append('height', options.height.toString());
      if (options.quality) params.append('quality', options.quality.toString());
      if (options.format) params.append('format', options.format);
      if (options.fit) params.append('resize', options.fit);

      if (params.toString()) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${params.toString()}`;
      }
    }

    return url;
  }

  // =====================================
  // PERFORMANCE MONITORING
  // =====================================

  startPerformanceMonitoring(): void {
    // Monitor page load time
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        this.updateLoadTime(loadTime);
      });

      // Monitor render time using Performance Observer
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              this.updateRenderTime(entry.duration);
            }
          });
        });
        
        observer.observe({ entryTypes: ['measure'] });
      }

      // Monitor memory usage
      setInterval(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          this.updateMemoryUsage(memory.usedJSHeapSize / memory.totalJSHeapSize);
        }
      }, 10000); // Every 10 seconds
    }
  }

  markPerformance(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
    }
  }

  measurePerformance(name: string, startMark: string, endMark: string): void {
    if (typeof performance !== 'undefined') {
      performance.measure(name, startMark, endMark);
    }
  }

  private updateLoadTime(time: number): void {
    this.metrics.loadTime = time;
  }

  private updateRenderTime(time: number): void {
    this.metrics.renderTime = time;
  }

  private updateApiResponseTime(time: number): void {
    // Simple moving average
    this.metrics.apiResponseTime = (this.metrics.apiResponseTime + time) / 2;
  }

  private updateMemoryUsage(usage: number): void {
    this.metrics.memoryUsage = usage;
  }

  private updateErrorRate(error: boolean): void {
    // Simple error rate calculation
    const currentRate = this.metrics.errorRate;
    this.metrics.errorRate = error 
      ? Math.min(currentRate + 0.01, 1) 
      : Math.max(currentRate - 0.01, 0);
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // =====================================
  // SETTINGS MANAGEMENT
  // =====================================

  updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.maxCacheSize = this.settings.cacheSize;
  }

  getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  // Lazy loading utilities
  createIntersectionObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }

    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });
  }

  // Virtual scrolling helper
  calculateVirtualItems(
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    scrollTop: number,
    overscan: number = 5
  ): { start: number; end: number; visibleStart: number; visibleEnd: number } {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(totalItems - 1, visibleEnd + overscan);

    return { start, end, visibleStart, visibleEnd };
  }

  // Resource cleanup
  cleanup(): void {
    this.cache.clear();
    this.prefetchQueue.clear();
    this.debounceMap.forEach(timeout => clearTimeout(timeout));
    this.debounceMap.clear();
  }
}

export const performanceService = new PerformanceService();

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceService.startPerformanceMonitoring();
}