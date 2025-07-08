import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the base Supabase client
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to determine if an error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  // Network errors
  if (error.message?.includes('fetch')) return true;
  if (error.message?.includes('network')) return true;
  if (error.message?.includes('Network request failed')) return true;
  
  // Rate limiting
  if (error.status === 429) return true;
  
  // Server errors
  if (error.status >= 500 && error.status < 600) return true;
  
  // Connection errors
  if (error.code === 'ECONNRESET') return true;
  if (error.code === 'ETIMEDOUT') return true;
  
  return false;
};

// Exponential backoff with jitter
const getRetryDelay = (attemptIndex: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const exponentialDelay = baseDelay * Math.pow(2, attemptIndex);
  const jitter = Math.random() * 1000; // 0-1 second random jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

// Retry wrapper for Supabase operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    onRetry?: (error: any, attemptIndex: number) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, onRetry } = options;
  
  let lastError: any;
  
  for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's not a retryable error or if it's the last attempt
      if (!isRetryableError(error) || attemptIndex === maxAttempts - 1) {
        throw error;
      }
      
      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(error, attemptIndex);
      }
      
      // Wait before retrying
      const delay = getRetryDelay(attemptIndex);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Export the enhanced client with retry capability
export const supabase = new Proxy(supabaseClient, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    
    // Only wrap certain methods with retry logic
    if (prop === 'from' || prop === 'rpc' || prop === 'storage') {
      return new Proxy(value, {
        apply(target, thisArg, argArray) {
          const result = Reflect.apply(target, thisArg, argArray);
          
          // Wrap the result methods with retry logic
          return new Proxy(result, {
            get(target, prop, receiver) {
              const value = Reflect.get(target, prop, receiver);
              
              // Wrap async methods
              if (typeof value === 'function' && 
                  ['select', 'insert', 'update', 'upsert', 'delete', 'download', 'upload'].includes(String(prop))) {
                return function(...args: any[]) {
                  const originalResult = value.apply(this, args);
                  
                  // If it returns a promise-like object with methods, wrap those too
                  if (originalResult && typeof originalResult.then !== 'function') {
                    return new Proxy(originalResult, {
                      get(target, prop, receiver) {
                        const value = Reflect.get(target, prop, receiver);
                        
                        // Wrap the final execution methods
                        if (typeof value === 'function' && 
                            ['single', 'maybeSingle', 'csv', 'execute'].includes(String(prop))) {
                          return function(...args: any[]) {
                            return withRetry(() => value.apply(this, args));
                          };
                        }
                        
                        return value;
                      }
                    });
                  }
                  
                  return originalResult;
                };
              }
              
              return value;
            }
          });
        }
      });
    }
    
    return value;
  }
});

// Also export the base client for cases where retry isn't wanted
export const supabaseWithoutRetry = supabaseClient;