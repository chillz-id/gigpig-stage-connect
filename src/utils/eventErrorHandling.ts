import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { errorService, ErrorHandlingOptions } from '@/services/errorService';
import { handleEventAuthError } from './eventAuthHandler';

// Event-specific error codes and messages
const EVENT_ERROR_MESSAGES: Record<string, string> = {
  // Unique constraint violations
  '23505_events_title_event_date_venue_key': 'An event with this title, date, and venue already exists',
  '23505_events_slug_key': 'An event with this URL slug already exists',
  
  // Foreign key violations
  '23503_events_venue_id_fkey': 'The selected venue does not exist',
  '23503_events_promoter_id_fkey': 'The promoter profile does not exist',
  '23503_event_spots_performer_id_fkey': 'One or more selected performers do not exist',
  
  // Check constraint violations
  '23514_events_check_valid_status': 'Invalid event status. Must be draft, open, closed, cancelled, or completed',
  '23514_events_check_valid_dates': 'Event end time must be after start time',
  '23514_events_check_positive_capacity': 'Event capacity must be greater than 0',
  '23514_events_check_positive_spots': 'Total spots must be greater than 0',
  '23514_events_check_valid_ticket_price': 'Ticket price cannot be negative',
  
  // Custom business logic errors
  'insufficient_permissions': 'You do not have permission to create or modify events',
  'invalid_date_past': 'Cannot create events in the past',
  'spots_exceed_capacity': 'Number of spots cannot exceed venue capacity',
  'duplicate_performer': 'A performer cannot have multiple spots in the same event',
  'event_full': 'This event is already full',
  'event_closed': 'This event is closed and cannot be modified',
  'missing_required_fields': 'Please fill in all required fields',
  'invalid_recurring_dates': 'Invalid recurring event configuration',
  
  // Network and timeout errors
  'network_error': 'Network connection error. Please check your internet connection',
  'timeout': 'Request timed out. Please try again',
  'server_error': 'Server error. Please try again later',
};

// Field mapping for user-friendly messages
const FIELD_LABELS: Record<string, string> = {
  title: 'Event Title',
  event_date: 'Event Date',
  venue: 'Venue',
  venue_id: 'Venue',
  promoter_id: 'Promoter',
  start_time: 'Start Time',
  end_time: 'End Time',
  capacity: 'Capacity',
  total_spots: 'Total Spots',
  ticket_price: 'Ticket Price',
  status: 'Event Status',
  description: 'Description',
  requirements: 'Requirements',
};

export interface EventError {
  code?: string;
  message: string;
  field?: string;
  details?: any;
  userMessage: string;
  severity: 'low' | 'medium' | 'high';
  recoverable: boolean;
}

/**
 * Parse database error and return user-friendly event error
 */
export function parseEventError(error: any): EventError {
  // Handle PostgrestError
  if (error?.code) {
    const errorKey = `${error.code}${error.details ? '_' + error.details : ''}`;
    
    // Check for specific event error messages
    if (EVENT_ERROR_MESSAGES[errorKey]) {
      return {
        code: error.code,
        message: error.message || 'Database error',
        userMessage: EVENT_ERROR_MESSAGES[errorKey],
        severity: getErrorSeverity(error.code),
        recoverable: isRecoverableError(error.code),
        details: error.details,
      };
    }
    
    // Handle generic database errors
    return handleGenericDatabaseError(error);
  }
  
  // Handle network errors
  if (error?.message?.toLowerCase().includes('network') || 
      error?.message?.toLowerCase().includes('fetch')) {
    return {
      code: 'network_error',
      message: error.message,
      userMessage: EVENT_ERROR_MESSAGES.network_error,
      severity: 'medium',
      recoverable: true,
    };
  }
  
  // Handle timeout errors
  if (error?.message?.toLowerCase().includes('timeout')) {
    return {
      code: 'timeout',
      message: error.message,
      userMessage: EVENT_ERROR_MESSAGES.timeout,
      severity: 'medium',
      recoverable: true,
    };
  }
  
  // Handle validation errors with field information
  if (error?.field) {
    const fieldLabel = FIELD_LABELS[error.field] || error.field;
    return {
      code: 'validation_error',
      message: error.message,
      field: error.field,
      userMessage: `${fieldLabel}: ${error.message}`,
      severity: 'low',
      recoverable: true,
    };
  }
  
  // Default error
  return {
    code: 'unknown',
    message: error?.message || 'An unexpected error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    severity: 'medium',
    recoverable: true,
  };
}

/**
 * Handle generic database errors
 */
function handleGenericDatabaseError(error: PostgrestError): EventError {
  let userMessage = 'Database error occurred';
  let severity: 'low' | 'medium' | 'high' = 'medium';
  
  switch (error.code) {
    case '23505': // Unique violation
      userMessage = 'This event information already exists';
      severity = 'low';
      break;
    case '23503': // Foreign key violation
      userMessage = 'Related data not found. Please check your selections.';
      severity = 'medium';
      break;
    case '23514': // Check constraint violation
      userMessage = 'Invalid data provided. Please check your input.';
      severity = 'low';
      break;
    case '42501': // Insufficient privilege
      userMessage = 'You do not have permission to perform this action';
      severity = 'high';
      break;
    case '22P02': // Invalid text representation
      userMessage = 'Invalid data format. Please check your input.';
      severity = 'low';
      break;
    default:
      userMessage = `Database error: ${error.message}`;
  }
  
  return {
    code: error.code,
    message: error.message,
    userMessage,
    severity,
    recoverable: isRecoverableError(error.code),
    details: error.details,
  };
}

/**
 * Determine error severity based on error code
 */
function getErrorSeverity(code: string): 'low' | 'medium' | 'high' {
  // High severity - permission/auth errors
  if (code === '42501' || code === '42P01') return 'high';
  
  // Low severity - validation errors
  if (code === '23514' || code === '22P02' || code === '23505') return 'low';
  
  // Medium severity - everything else
  return 'medium';
}

/**
 * Check if error is recoverable (user can fix and retry)
 */
function isRecoverableError(code: string): boolean {
  const nonRecoverableCodes = ['42501', '42P01']; // Permission errors
  return !nonRecoverableCodes.includes(code);
}

/**
 * Handle event creation error with proper logging and user feedback
 */
export async function handleEventCreationError(
  error: any,
  eventData?: any
): Promise<void> {
  const eventError = parseEventError(error);
  
  // Log to error service
  await errorService.logError(error, {
    category: 'database_error',
    severity: eventError.severity,
    component: 'EventCreation',
    action: 'create_event',
    metadata: {
      eventData: eventData ? {
        title: eventData.title,
        venue: eventData.venue,
        date: eventData.event_date,
      } : undefined,
      errorCode: eventError.code,
      recoverable: eventError.recoverable,
    },
  });
  
  // Show user-friendly toast
  toast({
    title: 'Failed to create event',
    description: eventError.userMessage,
    variant: 'destructive',
    duration: eventError.recoverable ? 5000 : 10000,
  });
  
  // If it's a field-specific error, we might want to highlight the field
  if (eventError.field) {
    // This could trigger field highlighting in the form
    console.error(`Field error: ${eventError.field}`, eventError);
  }
}

/**
 * Handle event update error
 */
export async function handleEventUpdateError(
  error: any,
  eventId: string,
  updateData?: any
): Promise<void> {
  const eventError = parseEventError(error);
  
  await errorService.logError(error, {
    category: 'database_error',
    severity: eventError.severity,
    component: 'EventUpdate',
    action: 'update_event',
    metadata: {
      eventId,
      updateData,
      errorCode: eventError.code,
    },
  });
  
  toast({
    title: 'Failed to update event',
    description: eventError.userMessage,
    variant: 'destructive',
  });
}

/**
 * Handle event deletion error
 */
export async function handleEventDeletionError(
  error: any,
  eventId: string
): Promise<void> {
  const eventError = parseEventError(error);
  
  // Check if it's a foreign key constraint (e.g., event has applications)
  if (error.code === '23503') {
    eventError.userMessage = 'Cannot delete this event because it has associated data (applications, bookings, etc.)';
  }
  
  await errorService.logError(error, {
    category: 'database_error',
    severity: eventError.severity,
    component: 'EventDeletion',
    action: 'delete_event',
    metadata: {
      eventId,
      errorCode: eventError.code,
    },
  });
  
  toast({
    title: 'Failed to delete event',
    description: eventError.userMessage,
    variant: 'destructive',
  });
}

/**
 * Validate event data before submission
 */
export function validateEventData(eventData: any): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!eventData.title?.trim()) {
    errors.title = 'Event title is required';
  }
  
  if (!eventData.venue?.trim() && !eventData.venue_id) {
    errors.venue = 'Venue is required';
  }
  
  if (!eventData.event_date) {
    errors.event_date = 'Event date is required';
  } else {
    // Check if date is in the past
    const eventDate = new Date(eventData.event_date);
    if (eventDate < new Date()) {
      errors.event_date = 'Event date cannot be in the past';
    }
  }
  
  if (!eventData.start_time) {
    errors.start_time = 'Start time is required';
  }
  
  // Validate time order
  if (eventData.start_time && eventData.end_time) {
    const start = new Date(`2000-01-01T${eventData.start_time}`);
    const end = new Date(`2000-01-01T${eventData.end_time}`);
    if (end <= start) {
      errors.end_time = 'End time must be after start time';
    }
  }
  
  // Validate numeric fields
  if (eventData.capacity !== undefined && eventData.capacity <= 0) {
    errors.capacity = 'Capacity must be greater than 0';
  }
  
  if (eventData.total_spots !== undefined && eventData.total_spots <= 0) {
    errors.total_spots = 'Total spots must be greater than 0';
  }
  
  if (eventData.ticket_price !== undefined && eventData.ticket_price < 0) {
    errors.ticket_price = 'Ticket price cannot be negative';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Enhanced error handler with retry logic for event operations
 */
export async function withEventErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    action: 'create' | 'update' | 'delete';
    eventId?: string;
    eventData?: any;
  }
): Promise<T | null> {
  const options: ErrorHandlingOptions = {
    component: 'EventManagement',
    action: `event_${context.action}`,
    category: 'database_error',
    retryable: true,
    maxRetries: 3,
    showToast: false, // We'll handle toast ourselves
  };
  
  try {
    return await errorService.handleError(operation, options);
  } catch (error) {
    // Handle specific event errors
    switch (context.action) {
      case 'create':
        await handleEventCreationError(error, context.eventData);
        break;
      case 'update':
        await handleEventUpdateError(error, context.eventId!, context.eventData);
        break;
      case 'delete':
        await handleEventDeletionError(error, context.eventId!);
        break;
    }
    
    return null;
  }
}