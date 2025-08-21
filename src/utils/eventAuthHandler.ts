import { toast } from '@/hooks/use-toast';
import { sessionManager } from './sessionManager';

interface AuthErrorOptions {
  operation: string;
  showToast?: boolean;
  retryCallback?: () => Promise<any>;
}

/**
 * Handle authentication errors in event operations
 */
export async function handleEventAuthError(
  error: any,
  options: AuthErrorOptions
): Promise<any> {
  const { operation, showToast = true, retryCallback } = options;
  
  // Check if it's an auth error
  if (
    error.status === 401 ||
    error.code === 'PGRST301' ||
    error.message?.toLowerCase().includes('jwt') ||
    error.message?.toLowerCase().includes('token') ||
    error.message?.toLowerCase().includes('unauthorized')
  ) {
    console.log(`[EventAuthHandler] Auth error during ${operation}, attempting recovery...`);
    
    // Try to refresh the session
    const refreshed = await sessionManager.handleAuthError(error);
    
    if (refreshed && retryCallback) {
      console.log(`[EventAuthHandler] Session refreshed, retrying ${operation}...`);
      try {
        // Retry the operation
        const result = await retryCallback();
        
        if (showToast) {
          toast({
            title: "Success",
            description: `${operation} completed successfully after re-authentication.`,
          });
        }
        
        return result;
      } catch (retryError) {
        console.error(`[EventAuthHandler] Retry failed for ${operation}:`, retryError);
        throw retryError;
      }
    } else {
      // Session refresh failed
      if (showToast) {
        toast({
          title: "Authentication Required",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      }
      
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      
      throw new Error('Authentication required');
    }
  }
  
  // Not an auth error, throw it as is
  throw error;
}

/**
 * Wrap an async function with auth error handling
 */
export function withAuthErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operation: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleEventAuthError(error, {
        operation,
        retryCallback: () => fn(...args),
      });
    }
  }) as T;
}