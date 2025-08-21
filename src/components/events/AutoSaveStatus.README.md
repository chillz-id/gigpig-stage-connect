# AutoSaveStatus Component

A visual indicator component for displaying auto-save status in forms and editors. Provides real-time feedback to users about the save state of their work.

## Features

- **Multiple States**: Supports `idle`, `saving`, `saved`, and `error` states
- **Theme Support**: Works with both business and pleasure themes
- **Auto-hide**: "Saved" status automatically fades out after 2 seconds
- **Accessibility**: Proper ARIA labels and role attributes
- **Two Modes**: Full status indicator and minimal icon-only mode
- **Smooth Animations**: Fade transitions and loading animations

## Usage

### Basic Usage

```tsx
import { AutoSaveStatus } from '@/components/events';

function MyForm() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);

  return (
    <div>
      <AutoSaveStatus
        status={saveStatus}
        lastSaved={lastSaved}
        error={saveError}
      />
    </div>
  );
}
```

### Icon-Only Mode

For constrained spaces, use the `AutoSaveIcon` component:

```tsx
import { AutoSaveIcon } from '@/components/events';

<AutoSaveIcon
  status={saveStatus}
  lastSaved={lastSaved}
  error={saveError}
  showText={false} // Optional: show text alongside icon
/>
```

### Positioning Examples

```tsx
// Fixed in corner
<AutoSaveStatus
  status={saveStatus}
  lastSaved={lastSaved}
  error={saveError}
  className="fixed bottom-4 right-4 z-50"
/>

// Inline with form field
<div className="relative">
  <Input />
  <div className="absolute right-2 top-1/2 -translate-y-1/2">
    <AutoSaveIcon status={saveStatus} lastSaved={lastSaved} error={saveError} />
  </div>
</div>

// In card header
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle>Form Title</CardTitle>
    <AutoSaveStatus status={saveStatus} lastSaved={lastSaved} error={saveError} />
  </div>
</CardHeader>
```

## Props

### AutoSaveStatus

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| status | `'idle' \| 'saving' \| 'saved' \| 'error'` | Yes | Current save status |
| lastSaved | `Date \| null` | Yes | Timestamp of last successful save |
| error | `Error \| null` | Yes | Error object if save failed |
| className | `string` | No | Additional CSS classes |

### AutoSaveIcon

All props from `AutoSaveStatus` plus:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| showText | `boolean` | No | `false` | Show status text alongside icon |

## Status Behaviors

- **idle**: Component is hidden
- **saving**: Shows animated spinner with "Saving..." text
- **saved**: Shows checkmark with "Saved" text and relative time, auto-hides after 2 seconds
- **error**: Shows error icon with message, remains visible until status changes

## Implementation Example

See `AutoSaveExample.tsx` for a complete implementation example with debounced auto-save functionality.

## Testing

Run tests with:
```bash
npm run test -- tests/auto-save-status.test.tsx
```

## Demo

View the interactive demo:
```tsx
import { AutoSaveStatusDemo } from '@/components/events/AutoSaveStatus.stories';

// Use in a route or page
<AutoSaveStatusDemo />
```