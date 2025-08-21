import { toast } from '@/hooks/use-toast';
import { errorService } from '@/services/errorService';

interface NetworkErrorContext {
  operation: string;
  eventId?: string;
  eventTitle?: string;
  additionalData?: any;
}

/**
 * Handle network errors with retry capability
 */
export class EventNetworkErrorHandler {
  private static retryQueue: Map<string, {
    operation: () => Promise<any>;
    context: NetworkErrorContext;
    attempts: number;
  }> = new Map();

  private static isOnline = navigator.onLine;

  static {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      EventNetworkErrorHandler.isOnline = true;
      EventNetworkErrorHandler.processRetryQueue();
    });

    window.addEventListener('offline', () => {
      EventNetworkErrorHandler.isOnline = false;
      toast({
        title: 'Connection Lost',
        description: 'You are offline. Changes will be synced when connection is restored.',
        variant: 'destructive',
      });
    });
  }

  /**
   * Handle network error with optional retry
   */
  static async handleNetworkError(
    error: any,
    context: NetworkErrorContext,
    operation?: () => Promise<any>
  ): Promise<void> {
    // Log the error
    await errorService.logError(error, {
      category: 'network_error',
      severity: 'medium',
      component: 'EventNetworkHandler',
      action: context.operation,
      metadata: {
        isOnline: this.isOnline,
        eventId: context.eventId,
        eventTitle: context.eventTitle,
        ...context.additionalData,
      },
    });

    if (!this.isOnline) {
      // Add to retry queue if operation provided
      if (operation) {
        const queueKey = `${context.operation}_${context.eventId || Date.now()}`;
        this.retryQueue.set(queueKey, {
          operation,
          context,
          attempts: 0,
        });

        toast({
          title: 'Offline Mode',
          description: 'This action will be retried when you\'re back online.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'No Connection',
          description: 'Please check your internet connection and try again.',
          variant: 'destructive',
        });
      }
    } else {
      // Online but still got network error
      toast({
        title: 'Network Error',
        description: 'Connection issue detected. Please try again.',
        variant: 'destructive',
      });
    }
  }

  /**
   * Process queued operations when back online
   */
  private static async processRetryQueue(): Promise<void> {
    if (this.retryQueue.size === 0) return;

    toast({
      title: 'Connection Restored',
      description: `Processing ${this.retryQueue.size} pending operations...`,
    });

    const queue = Array.from(this.retryQueue.entries());
    this.retryQueue.clear();

    for (const [key, item] of queue) {
      try {
        await item.operation();
        
        // Log successful retry
        await errorService.logError('Network retry successful', {
          category: 'network_error',
          severity: 'low',
          component: 'EventNetworkHandler',
          action: 'retry_success',
          metadata: item.context,
          showToast: false,
          logToService: true,
        });
      } catch (error) {
        item.attempts++;
        
        if (item.attempts < 3) {
          // Re-add to queue for another attempt
          this.retryQueue.set(key, item);
        } else {
          // Max attempts reached
          await errorService.logError(error as Error, {
            category: 'network_error',
            severity: 'high',
            component: 'EventNetworkHandler',
            action: 'retry_failed',
            metadata: {
              ...item.context,
              attempts: item.attempts,
            },
          });

          toast({
            title: 'Sync Failed',
            description: `Failed to sync ${item.context.operation}. Please try manually.`,
            variant: 'destructive',
          });
        }
      }
    }

    if (this.retryQueue.size === 0) {
      toast({
        title: 'Sync Complete',
        description: 'All pending operations have been processed.',
      });
    }
  }

  /**
   * Check if a specific operation is queued
   */
  static isOperationQueued(operation: string, eventId?: string): boolean {
    const queueKey = `${operation}_${eventId || ''}`;
    return Array.from(this.retryQueue.keys()).some(key => key.startsWith(queueKey));
  }

  /**
   * Clear retry queue (useful for logout)
   */
  static clearQueue(): void {
    this.retryQueue.clear();
  }
}

/**
 * Utility function to wrap operations with network error handling
 */
export async function withNetworkErrorHandling<T>(
  operation: () => Promise<T>,
  context: NetworkErrorContext,
  enableRetry = true
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    // Check if it's a network error
    if (
      error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('fetch') ||
      error.code === 'NETWORK_ERROR' ||
      !navigator.onLine
    ) {
      await EventNetworkErrorHandler.handleNetworkError(
        error,
        context,
        enableRetry ? operation : undefined
      );
      return null;
    }
    
    // Not a network error, re-throw
    throw error;
  }
}

/**
 * Hook to check network status
 */
export function useNetworkStatus() {
  const isOnline = navigator.onLine;
  const hasQueuedOperations = EventNetworkErrorHandler.isOperationQueued('');
  
  return {
    isOnline,
    hasQueuedOperations,
  };
}