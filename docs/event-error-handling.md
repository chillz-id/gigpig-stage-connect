# Event Error Handling Documentation

## Overview
This document describes the comprehensive error handling system implemented for Events in the Stand Up Sydney platform.

## Key Components

### 1. Error Handling Utilities
- **Location**: `/src/utils/eventErrorHandling.ts`
- **Features**:
  - Event-specific error parsing
  - Database constraint violation handling
  - User-friendly error messages
  - Validation utilities
  - Error categorization and severity levels

### 2. Enhanced Hooks
- **`useCreateEvent`**: `/src/hooks/useCreateEvent.ts`
  - Handles event creation with validation
  - Provides field-level error feedback
  - Integrates with error service for logging
  
- **`useUpdateEvent`**: `/src/hooks/useUpdateEvent.ts`
  - Similar to create but for updates
  - Maintains update history in logs
  
- **`useEventSpotsWithErrorHandling`**: `/src/hooks/useEventSpotsWithErrorHandling.ts`
  - Manages performer spots with error handling
  - Prevents duplicate performers
  - Handles reordering operations

### 3. Network Error Handling
- **Location**: `/src/utils/eventNetworkErrorHandler.ts`
- **Features**:
  - Offline mode detection
  - Automatic retry queue
  - Sync when connection restored
  - Progress notifications

### 4. API Layer Enhancements
- **Location**: `/src/services/api/events.ts`
- **Improvements**:
  - Enhanced logging for debugging
  - Transaction rollback on failures
  - Detailed error context
  - User-friendly error messages

### 5. UI Components
- **`FieldError`**: `/src/components/ui/field-error.tsx`
  - Displays field-specific errors
  
- **`EventErrorBoundary`**: `/src/components/EventErrorBoundary.tsx`
  - Catches React component errors
  - Provides recovery options
  - Logs errors with IDs for support

## Error Types Handled

### Database Errors
1. **Unique Constraint Violations** (23505)
   - Duplicate event titles on same date/venue
   - Custom messages for each constraint

2. **Foreign Key Violations** (23503)
   - Invalid venue references
   - Invalid performer references
   - Clear guidance on fixing

3. **Check Constraint Violations** (23514)
   - Invalid date/time combinations
   - Negative values
   - Capacity constraints

4. **Permission Errors** (42501)
   - Unauthorized actions
   - Clear permission requirements

### Network Errors
- Connection failures
- Timeouts
- Offline mode handling
- Automatic retry with backoff

### Validation Errors
- Required field validation
- Date/time logic validation
- Numeric range validation
- Field-specific error messages

## Usage Examples

### Creating an Event with Error Handling
```typescript
import { useCreateEvent } from '@/hooks/useCreateEvent';

function CreateEventComponent() {
  const { createEvent, isCreating, validationErrors } = useCreateEvent();
  
  const handleSubmit = async (data) => {
    await createEvent(data);
    // Errors are automatically handled and displayed
  };
  
  return (
    <form>
      <Input name="title" />
      {validationErrors.title && (
        <FieldError error={validationErrors.title} />
      )}
      {/* ... other fields ... */}
    </form>
  );
}
```

### Wrapping Components with Error Boundary
```typescript
import { EventErrorBoundary } from '@/components/EventErrorBoundary';

function EventPage() {
  return (
    <EventErrorBoundary>
      <EventDetails />
    </EventErrorBoundary>
  );
}
```

### Network Error Handling
```typescript
import { withNetworkErrorHandling } from '@/utils/eventNetworkErrorHandler';

const result = await withNetworkErrorHandling(
  async () => await api.createEvent(data),
  {
    operation: 'create_event',
    eventTitle: data.title,
  },
  true // Enable retry
);
```

## Error Logging

All errors are logged to the error service with:
- Timestamp
- Severity level (low, medium, high, critical)
- Category (database, network, validation, etc.)
- Component and action context
- User ID (when available)
- Metadata for debugging

## User Experience

1. **Toast Notifications**: Clear, actionable error messages
2. **Field Highlighting**: Validation errors shown next to fields
3. **Offline Support**: Actions queued when offline
4. **Recovery Options**: Retry, reload, or navigate home
5. **Error IDs**: For support ticket reference

## Testing

Test suite available at `/tests/eventErrorHandling.test.ts` covering:
- Error parsing logic
- Validation rules
- Network error scenarios
- Recovery mechanisms

## Best Practices

1. Always use the provided hooks instead of direct API calls
2. Wrap event pages with EventErrorBoundary
3. Handle both synchronous and asynchronous errors
4. Provide context-specific error messages
5. Log errors for monitoring and debugging
6. Test error scenarios during development