import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export interface ApiResponse<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface QueryOptions extends PaginationParams {
  select?: string;
  filters?: Record<string, any>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Base delay in ms
const RETRYABLE_ERRORS = ['NETWORK_ERROR', 'TIMEOUT', '5XX'];

// Check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return true;
  }
  
  // Timeout errors
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    return true;
  }
  
  // Server errors (5xx)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Rate limiting
  if (error.status === 429) {
    return true;
  }
  
  return false;
};

// Exponential backoff delay
const getRetryDelay = (attempt: number): number => {
  return RETRY_DELAY * Math.pow(2, attempt - 1);
};

// Generic retry wrapper
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const { maxRetries = MAX_RETRIES, onRetry } = options;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      
      const delay = getRetryDelay(attempt);
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Base API class for common operations
export abstract class BaseApi<T> {
  protected tableName: string;
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  
  // Generic query builder
  protected buildQuery(options: QueryOptions = {}) {
    let query = supabase.from(this.tableName).select(options.select || '*');
    
    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value.operator) {
            // Support custom operators like { operator: 'gte', value: 10 }
            const { operator, value: val } = value;
            query = (query as any)[operator](key, val);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }
    
    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { 
        ascending: options.orderDirection === 'asc' 
      });
    }
    
    // Apply pagination
    if (options.page && options.pageSize) {
      const from = (options.page - 1) * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    }
    
    return query;
  }
  
  // Create operation with retry
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    return withRetry(async () => {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return { data: result, error: null };
    });
  }
  
  // Read operations with retry
  async findById(id: string): Promise<ApiResponse<T>> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .select()
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    });
  }
  
  async findMany(options: QueryOptions = {}): Promise<ApiResponse<T[]>> {
    return withRetry(async () => {
      const query = this.buildQuery(options);
      const { data, error } = await query;
      
      if (error) throw error;
      return { data: data || [], error: null };
    });
  }
  
  // Update operation with retry
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return withRetry(async () => {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: result, error: null };
    });
  }
  
  // Delete operation with retry
  async delete(id: string): Promise<ApiResponse<void>> {
    return withRetry(async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { data: null, error: null };
    });
  }
  
  // Batch operations
  async createMany(items: Partial<T>[]): Promise<ApiResponse<T[]>> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(items)
        .select();
      
      if (error) throw error;
      return { data: data || [], error: null };
    });
  }
  
  async deleteMany(ids: string[]): Promise<ApiResponse<void>> {
    return withRetry(async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      return { data: null, error: null };
    });
  }
}

// Handle API errors consistently
export function handleApiError(error: any, context?: string): void {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  let message = 'An unexpected error occurred';
  
  if (error.message) {
    message = error.message;
  } else if (error.code) {
    switch (error.code) {
      case '23505':
        message = 'This item already exists';
        break;
      case '23503':
        message = 'Related data not found';
        break;
      case '42501':
        message = 'You do not have permission to perform this action';
        break;
      case 'PGRST116':
        message = 'No data found';
        break;
      default:
        message = `Database error: ${error.code}`;
    }
  }
  
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
}

// Success handler
export function handleApiSuccess(message: string): void {
  toast({
    title: 'Success',
    description: message,
  });
}