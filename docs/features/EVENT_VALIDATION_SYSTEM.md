# Event Validation System Documentation

## Overview

The enhanced event validation system provides comprehensive validation, user-friendly warnings, and data integrity checks for event creation and editing. It prevents common mistakes and ensures high-quality event data.

## Key Features

### 1. Real-time Validation
- **Field-level validation**: Validates fields as users type with debouncing
- **Visual indicators**: Shows validation status with icons and colors
- **Inline error messages**: Displays specific errors below each field
- **Progress tracking**: Shows completion percentage with visual progress bar

### 2. User-Friendly Warnings
- **Smart warnings**: Contextual warnings for valid but questionable data
- **Severity levels**: Differentiates between errors (blocking) and warnings (advisory)
- **Actionable feedback**: Provides specific suggestions for fixing issues
- **Visual hierarchy**: Uses colors and icons to indicate severity

### 3. Event Preview
- **Desktop/Mobile preview**: Shows how the event will appear to users
- **Pre-publish checklist**: Validates all requirements before publishing
- **Validation summary**: Consolidated view of all issues
- **One-click fixes**: Jump directly to fields with errors

### 4. Data Integrity Checks
- **Duplicate detection**: Warns about similar events
- **Venue availability**: Checks for scheduling conflicts
- **Date/time validation**: Prevents past dates and illogical times
- **Capacity checks**: Ensures venue capacity matches spots

### 5. Unsaved Changes Protection
- **Auto-detection**: Tracks changes across all form fields
- **Navigation warnings**: Alerts when leaving with unsaved changes
- **Save options**: Quick save, save and continue, or discard
- **Browser refresh protection**: Warns before losing data

## Components

### ValidationFeedback Component
```tsx
import { ValidationFeedback } from '@/components/events/ValidationFeedback';

<ValidationFeedback
  errors={['Title is required']}
  warnings={['Event is scheduled very late']}
  success="All validations passed"
  info="Tips for better event titles"
/>
```

### EventPreview Component
```tsx
import { EventPreview } from '@/components/events/EventPreview';

<EventPreview
  open={showPreview}
  onClose={() => setShowPreview(false)}
  formData={formData}
  eventSpots={spots}
  recurringSettings={recurring}
  validationResult={validation}
  onPublish={handlePublish}
/>
```

### UnsavedChangesWarning Component
```tsx
import { UnsavedChangesWarning } from '@/components/events/UnsavedChangesWarning';

<UnsavedChangesWarning
  hasUnsavedChanges={isDirty}
  onSave={handleSave}
  onDiscard={handleDiscard}
/>
```

## Validation Rules

### Required Fields
- Event title (3-100 characters)
- Venue name and address
- Event date (must be future)
- Start time
- At least one performance spot

### Date/Time Rules
- No past dates allowed
- Warning for events >6 months in future
- Warning for tomorrow's events
- End time must be after start time
- Warning for events >6 hours duration
- Warning for late night events (after 10pm)

### Venue Rules
- Complete address required (>10 characters)
- Capacity must be greater than 0
- Capacity must exceed number of spots
- Warning for very large venues (>1000)
- Warning for very small venues (<20)

### Ticketing Rules
- External ticketing requires valid URL
- Internal ticketing requires at least one ticket type
- URL validation for external links

### Recurring Events
- End date required for non-custom patterns
- At least one date for custom patterns
- No past dates in custom selections
- Warning for >26 weekly occurrences

## Hooks

### useEventValidation Hook
```tsx
const validation = useEventValidation(formData, spots, recurring, {
  validateOnChange: true,
  validateOnBlur: true,
  debounceMs: 500
});

// Access validation state
validation.isValid
validation.hasErrors
validation.errorCount
validation.warningCount

// Validate specific field
validation.validateSingleField('title', value);

// Handle field changes
validation.handleFieldChange('title', value);
validation.handleFieldBlur('title', value);

// Get field-specific validation
const titleValidation = validation.getFieldValidation('title');
```

### useEventDuplicateCheck Hook
```tsx
const duplicateCheck = useEventDuplicateCheck(
  title, date, venue, startTime, endTime,
  { excludeEventId, debounceMs: 1000 }
);

// Check status
duplicateCheck.hasDuplicateWarning
duplicateCheck.hasVenueConflict
duplicateCheck.canCreateEvent

// Access results
duplicateCheck.duplicateResult.similarEvents
duplicateCheck.venueAvailability.conflicts
```

## Integration Example

```tsx
import { CreateEventFormEnhanced } from '@/components/CreateEventFormEnhanced';

// The enhanced form includes:
// - Real-time validation
// - Unsaved changes detection
// - Preview functionality
// - Progress tracking
// - Duplicate checking
// - All validation features

<CreateEventFormEnhanced />
```

## Validation Flow

1. **Initial State**: Fields show required indicators
2. **User Input**: Real-time validation with debouncing
3. **Field Blur**: Full validation runs immediately
4. **Form Submit**: All fields validated, errors prevent submission
5. **Preview**: Shows validation summary and checklist
6. **Publish**: Final validation before creating event

## Best Practices

1. **Progressive Disclosure**: Show validation feedback progressively
2. **Positive Reinforcement**: Show success states for valid fields
3. **Contextual Help**: Provide tips and examples inline
4. **Smart Defaults**: Pre-fill sensible defaults where possible
5. **Graceful Degradation**: Allow draft saves even with errors

## Error Messages Style Guide

- **Be specific**: "Event date cannot be in the past" not "Invalid date"
- **Be helpful**: "Title must be at least 3 characters long" not "Title too short"
- **Be actionable**: "Please provide a complete address" not "Invalid address"
- **Be friendly**: Use positive language where possible

## Testing

Run validation tests:
```bash
npm run test -- tests/event-validation.test.ts
```

The test suite covers:
- Individual validators
- Field validation
- Form validation
- Unsaved changes detection
- Edge cases and error conditions