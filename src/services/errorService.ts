// Error Handling and Logging Service - Comprehensive error management and monitoring
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'api_error' 
  | 'validation_error' 
  | 'network_error' 
  | 'authentication_error' 
  | 'authorization_error' 
  | 'database_error' 
  | 'file_upload_error' 
  | 'payment_error' 
  | 'integration_error' 
  | 'ui_error' 
  | 'performance_error' 
  | 'security_error'
  | 'unknown_error';

export interface ErrorLog {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  user_id?: string;
  user_agent?: string;
  url?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface ErrorSummary {
  total_errors: number;
  errors_by_severity: Record<ErrorSeverity, number>;
  errors_by_category: Record<ErrorCategory, number>;
  most_common_errors: Array<{ message: string; count: number }>;
  error_rate_trend: Array<{ date: string; count: number }>;
  unresolved_count: number;
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logToService?: boolean;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  retryable?: boolean;
  maxRetries?: number;
  fallbackValue?: any;
  userMessage?: string;
}

class ErrorService {
  private errorQueue: ErrorLog[] = [];
  private maxQueueSize = 100;
  private flushInterval = 30000; // 30 seconds
  private retryAttempts = new Map<string, number>();

  constructor() {
    this.startErrorQueueFlushing();
    this.setupGlobalErrorHandlers();
  }

  // =====================================
  // ERROR LOGGING
  // =====================================

  async logError(
    error: Error | string,
    options: ErrorHandlingOptions = {}
  ): Promise<void> {
    const {
      severity = 'medium',
      category = 'unknown_error',
      component,
      action,
      metadata = {},
      logToService = true
    } = options;

    const errorLog: Omit<ErrorLog, 'id'> = {
      timestamp: new Date().toISOString(),
      severity,
      category,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      component,
      action,
      metadata: {
        ...metadata,
        ...(typeof error === 'object' && error.name ? { error_name: error.name } : {})
      }
    };

    // Add to queue for batch processing
    if (logToService) {
      this.addToQueue(errorLog);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}] ${category}:`, error);
    }
  }

  private addToQueue(errorLog: Omit<ErrorLog, 'id'>): void {
    const fullLog: ErrorLog = {
      ...errorLog,
      id: crypto.randomUUID?.() || `error_${Date.now()}_${Math.random()}`
    };

    this.errorQueue.push(fullLog);

    // Remove oldest errors if queue is full
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    try {
      const errors = [...this.errorQueue];
      this.errorQueue = [];

      const { error } = await supabase
        .from('error_logs')
        .insert(errors);

      if (error) {
        console.error('Failed to flush error queue:', error);
        // Put errors back in queue
        this.errorQueue.unshift(...errors);
      }
    } catch (error) {
      console.error('Error queue flush failed:', error);
    }
  }

  private startErrorQueueFlushing(): void {
    setInterval(() => {
      this.flushErrorQueue();
    }, this.flushInterval);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushErrorQueue();
      });
    }
  }

  // =====================================
  // ERROR HANDLING HELPERS
  // =====================================

  async handleError<T>(
    operation: () => Promise<T>,
    options: ErrorHandlingOptions = {}
  ): Promise<T | undefined> {
    const {
      retryable = false,
      maxRetries = 3,
      fallbackValue,
      userMessage,
      showToast = true,
      component,
      action
    } = options;

    const operationKey = `${component}_${action}_${Date.now()}`;
    let attempts = this.retryAttempts.get(operationKey) || 0;

    try {
      const result = await operation();
      
      // Reset retry count on success
      this.retryAttempts.delete(operationKey);
      
      return result;
    } catch (error) {
      attempts++;
      this.retryAttempts.set(operationKey, attempts);

      // Log the error
      await this.logError(error as Error, {
        ...options,
        metadata: {
          ...options.metadata,
          attempts,
          retryable,
          maxRetries
        }
      });

      // Show user-friendly message
      if (showToast) {
        const message = userMessage || this.getUserFriendlyMessage(error as Error, options.category);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }

      // Retry if enabled and under limit
      if (retryable && attempts < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000); // Exponential backoff, max 10s
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.handleError(operation, options);
      }

      // Clean up retry tracking
      this.retryAttempts.delete(operationKey);

      // Return fallback value if provided
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }

      // Re-throw if no fallback
      throw error;
    }
  }

  private getUserFriendlyMessage(error: Error, category?: ErrorCategory): string {
    const defaultMessages: Record<ErrorCategory, string> = {
      api_error: 'There was a problem connecting to our servers. Please try again.',
      validation_error: 'Please check your input and try again.',
      network_error: 'Please check your internet connection and try again.',
      authentication_error: 'Please sign in to continue.',
      authorization_error: 'You do not have permission to perform this action.',
      database_error: 'There was a problem saving your data. Please try again.',
      file_upload_error: 'There was a problem uploading your file. Please try again.',
      payment_error: 'There was a problem processing your payment. Please try again.',
      integration_error: 'There was a problem with an external service. Please try again later.',
      ui_error: 'There was a problem with the interface. Please refresh and try again.',
      performance_error: 'The system is running slowly. Please try again in a moment.',
      security_error: 'A security issue was detected. Please contact support.',
      unknown_error: 'An unexpected error occurred. Please try again.'
    };

    if (category && defaultMessages[category]) {
      return defaultMessages[category];
    }

    // Try to extract meaningful message from error
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return defaultMessages.network_error;
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return defaultMessages.authentication_error;
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return defaultMessages.authorization_error;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return defaultMessages.validation_error;
    }

    return defaultMessages.unknown_error;
  }

  // =====================================
  // GLOBAL ERROR HANDLERS
  // =====================================

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        severity: 'high',
        category: 'unknown_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'window_error'
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason || new Error('Unhandled promise rejection'), {
        severity: 'high',
        category: 'unknown_error',
        metadata: {
          type: 'unhandled_rejection'
        }
      });
    });

    // Catch React error boundary errors (if using React)
    if (typeof console !== 'undefined') {
      const originalError = console.error;
      console.error = (...args) => {
        originalError.apply(console, args);
        
        // Check if this looks like a React error
        const message = args[0]?.toString() || '';
        if (message.includes('React') || message.includes('component')) {
          this.logError(new Error(message), {
            severity: 'medium',
            category: 'ui_error',
            metadata: {
              type: 'react_error',
              args: args.slice(1)
            }
          });
        }
      };
    }
  }

  // =====================================
  // ERROR ANALYSIS
  // =====================================

  async getErrorSummary(
    timeRange: { from: string; to: string },
    userId?: string
  ): Promise<ErrorSummary> {
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .gte('timestamp', timeRange.from)
        .lte('timestamp', timeRange.to);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: errors, error } = await query;

      if (error) throw error;

      const summary: ErrorSummary = {
        total_errors: errors?.length || 0,
        errors_by_severity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        errors_by_category: {
          api_error: 0,
          validation_error: 0,
          network_error: 0,
          authentication_error: 0,
          authorization_error: 0,
          database_error: 0,
          file_upload_error: 0,
          payment_error: 0,
          integration_error: 0,
          ui_error: 0,
          performance_error: 0,
          security_error: 0,
          unknown_error: 0
        },
        most_common_errors: [],
        error_rate_trend: [],
        unresolved_count: 0
      };

      if (!errors) return summary;

      // Analyze errors
      const messageCount = new Map<string, number>();
      
      errors.forEach(error => {
        // Count by severity
        summary.errors_by_severity[error.severity]++;
        
        // Count by category
        summary.errors_by_category[error.category]++;
        
        // Count by message
        const count = messageCount.get(error.message) || 0;
        messageCount.set(error.message, count + 1);
        
        // Count unresolved
        if (!error.resolved) {
          summary.unresolved_count++;
        }
      });

      // Get most common errors
      summary.most_common_errors = Array.from(messageCount.entries())
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return summary;
    } catch (error) {
      console.error('Failed to get error summary:', error);
      throw error;
    }
  }

  async resolveError(
    errorId: string,
    resolutionNotes: string,
    resolvedBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('error_logs')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: resolutionNotes
      })
      .eq('id', errorId);

    if (error) throw error;
  }

  // =====================================
  // SPECIFIC ERROR HANDLERS
  // =====================================

  handleApiError(error: any, operation: string): void {
    let category: ErrorCategory = 'api_error';
    let severity: ErrorSeverity = 'medium';

    // Categorize based on HTTP status
    if (error.status) {
      switch (Math.floor(error.status / 100)) {
        case 4:
          if (error.status === 401) {
            category = 'authentication_error';
            severity = 'high';
          } else if (error.status === 403) {
            category = 'authorization_error';
            severity = 'high';
          } else if (error.status === 422) {
            category = 'validation_error';
            severity = 'low';
          }
          break;
        case 5:
          severity = 'high';
          break;
      }
    }

    this.logError(error, {
      category,
      severity,
      action: operation,
      metadata: {
        status: error.status,
        statusText: error.statusText,
        url: error.url
      },
      showToast: true
    });
  }

  handleValidationError(errors: Record<string, string[]>, form: string): void {
    const errorMessage = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');

    this.logError(new Error(`Validation failed: ${errorMessage}`), {
      category: 'validation_error',
      severity: 'low',
      component: form,
      action: 'validation',
      metadata: { validation_errors: errors },
      showToast: true,
      userMessage: 'Please correct the highlighted fields and try again.'
    });
  }

  handleFileUploadError(error: Error, filename: string, fileSize: number): void {
    this.logError(error, {
      category: 'file_upload_error',
      severity: 'medium',
      action: 'file_upload',
      metadata: {
        filename,
        file_size: fileSize,
        max_size: 10 * 1024 * 1024 // 10MB typical limit
      },
      showToast: true,
      userMessage: 'There was a problem uploading your file. Please check the file size and format.'
    });
  }

  // =====================================
  // CLEANUP
  // =====================================

  cleanup(): void {
    this.flushErrorQueue();
    this.retryAttempts.clear();
  }
}

export const errorService = new ErrorService();

// React Error Boundary Helper
export class ErrorBoundary extends Error {
  componentStack?: string;
  
  constructor(message: string, componentStack?: string) {
    super(message);
    this.name = 'ErrorBoundary';
    this.componentStack = componentStack;
  }
}

// High-level error handler for async operations
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: ErrorHandlingOptions = {}
) => {
  return async (...args: T): Promise<R | undefined> => {
    return errorService.handleError(() => fn(...args), options);
  };
};