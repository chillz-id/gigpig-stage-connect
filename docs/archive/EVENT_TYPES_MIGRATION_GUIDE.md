# Event Types Migration Guide

## Overview

A new unified event types system has been implemented to resolve inconsistencies and provide a single source of truth for all event-related types in the Stand Up Sydney platform.

## Key Changes

### 1. New Unified Types File
- **Location**: `/src/types/events.unified.ts`
- **Purpose**: Single source of truth for all event-related types
- **Benefits**: 
  - Consistent field naming
  - Proper TypeScript types with JSDoc comments
  - Zod validation schemas included
  - Direct mapping to database schema

### 2. Field Naming Standardization

#### Spots vs Comedian Slots
- **Canonical field**: `spots: number | null`
- **Deprecated**: `comedian_slots`, `total_spots`
- **Migration**: The unified types handle backward compatibility

#### Event Type Fields
- **Database field**: `type: string | null`
- **Form field**: `event_type` (for specific enum values)
- **Unified**: Both are supported with proper typing

#### Date/Time Fields
- **Primary**: `event_date: string` (ISO datetime)
- **Time fields**: `start_time: string | null`, `end_time: string | null`
- **Computed**: `date` field removed (was a generated column)

### 3. Type Structure

```typescript
// Main Event type - canonical representation
interface Event {
  // Core fields
  id: string;
  title: string;
  event_date: string; // ISO datetime
  venue: string;
  
  // Standardized spots field
  spots: number | null;
  
  // All other fields...
}

// Input types for CRUD operations
interface CreateEventInput { /* ... */ }
interface UpdateEventInput { /* ... */ }

// Form types for UI
interface EventFormData { /* ... */ }
```

### 4. Validation Schemas

All types now include corresponding Zod validation schemas:

```typescript
import { createEventSchema, updateEventSchema, eventApplicationSchema } from '@/types/events.unified';

// Use for form validation
const validated = createEventSchema.parse(formData);
```

### 5. Enum Types

Proper TypeScript enums for type safety:

```typescript
enum EventStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

enum EventType {
  OPEN_MIC = 'open_mic',
  SHOWCASE = 'showcase',
  SPECIAL = 'special'
}

enum PerformanceType {
  SPOT = 'spot',
  FEATURE = 'feature',
  HEADLINE = 'headline',
  MC = 'mc'
}
```

## Migration Steps

### For New Code

1. Import from the unified types:
```typescript
import { Event, CreateEventInput, EventStatus } from '@/types/events.unified';
```

2. Use the standardized field names:
```typescript
// ✅ Correct
const totalSpots = event.spots;

// ❌ Avoid
const totalSpots = event.comedian_slots;
```

3. Use validation schemas:
```typescript
import { createEventSchema } from '@/types/events.unified';

const handleSubmit = (data: unknown) => {
  const validated = createEventSchema.parse(data);
  // validated is now type-safe
};
```

### For Existing Code

The old files (`event.ts` and `eventTypes.ts`) now re-export from the unified types for backward compatibility. No immediate changes required, but:

1. **Gradually migrate** imports to use `events.unified.ts`
2. **Update field references** to use canonical names
3. **Add validation** using the provided schemas

### Database Queries

When querying the database:

```typescript
// The unified types handle field mapping
const event = toDomainEvent(dbEvent);
// event.spots will be populated from spots OR comedian_slots
```

## Helper Functions

### Type Conversion
```typescript
import { toDomainEvent, formDataToCreateInput } from '@/types/events.unified';

// Convert database row to domain object
const event = toDomainEvent(dbRow);

// Convert form data to API input
const input = formDataToCreateInput(formData);
```

### Type Guards
```typescript
import { isEventStatus, isEventType } from '@/types/events.unified';

if (isEventStatus(value)) {
  // value is typed as EventStatus
}
```

## Best Practices

1. **Always validate** user input using the provided schemas
2. **Use enums** instead of string literals for type safety
3. **Import from unified types** for all new code
4. **Document migrations** when updating existing code
5. **Test thoroughly** when changing field references

## Backward Compatibility

The system maintains backward compatibility through:

1. **Type aliases** in the legacy files
2. **Field mapping** in helper functions
3. **Optional fields** to support gradual migration

## Future Improvements

1. Remove deprecated files after full migration
2. Add more specific validation rules
3. Implement computed fields as getters
4. Add more helper functions for common operations

## Summary

The unified event types provide:
- ✅ Single source of truth
- ✅ Consistent field naming
- ✅ Type safety with TypeScript
- ✅ Runtime validation with Zod
- ✅ Backward compatibility
- ✅ Clear migration path