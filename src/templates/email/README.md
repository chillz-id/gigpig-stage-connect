# Spot Notification System

This directory contains the email templates and notification system for managing spot assignments and confirmations in the comedy event platform.

## Overview

The spot notification system handles the complete workflow of assigning performance spots to comedians and managing their confirmations. It includes:

1. **Spot Assignment Notifications** - When a comedian is assigned a spot
2. **Confirmation Deadline Reminders** - When confirmation deadlines are approaching
3. **Spot Confirmation Notifications** - When a spot is confirmed or declined
4. **Spot Declined Notifications** - When a spot is declined by a comedian

## Components

### Email Templates

- **`spotAssignmentTemplate.ts`** - Initial spot assignment notification
- **`spotDeadlineTemplate.ts`** - Deadline reminder notifications
- **`spotConfirmationTemplate.ts`** - Confirmation success notifications
- **`spotDeclinedTemplate.ts`** - Spot declined notifications
- **`index.ts`** - Template utilities and metadata

### Services

- **`notificationService.ts`** - Enhanced with spot notification methods
- **`spotConfirmationService.ts`** - Handles spot assignment workflow

## Email Template Features

### Professional Design
- Responsive HTML email templates
- Gradient headers with appropriate colors
- Clear call-to-action buttons
- Mobile-friendly layouts
- Professional typography

### Comprehensive Information
- Event details (title, date, venue, address)
- Spot information (type, duration, special instructions)
- Contact information for promoters and comedians
- Clear next steps and deadlines

### Urgency Indicators
- Color-coded urgency levels (green for confirmation, yellow for reminders, red for urgent)
- Countdown timers for deadlines
- Clear visual hierarchy

## Notification Types

### 1. Spot Assignment (`spot_assigned`)
**Trigger:** When a comedian is assigned a spot
**Recipients:** Comedian
**Priority:** High
**Contains:**
- Event details
- Spot type and duration
- Confirmation deadline
- Contact information
- Confirmation link

### 2. Confirmation Deadline (`spot_confirmation_deadline`)
**Trigger:** When confirmation deadline is approaching
**Recipients:** Comedian
**Priority:** High/Urgent (based on hours remaining)
**Contains:**
- Hours remaining countdown
- Event summary
- Quick confirmation link
- Urgent styling if < 2 hours

### 3. Spot Confirmed (`spot_confirmed`)
**Trigger:** When a spot is confirmed by comedian
**Recipients:** Both comedian and promoter
**Priority:** Medium
**Contains:**
- Confirmation success message
- Event details
- Next steps
- Contact information

### 4. Spot Declined (`spot_declined`)
**Trigger:** When a spot is declined by comedian
**Recipients:** Both comedian and promoter
**Priority:** High (for promoter), Low (for comedian)
**Contains:**
- Decline confirmation
- Reason (if provided)
- Next steps for finding replacement
- Alternative event suggestions

## Usage

### Basic Spot Assignment
```typescript
import { notificationService } from '@/services/notificationService';

await notificationService.notifySpotAssigned(
  comedianId,
  eventId,
  eventTitle,
  eventDate,
  spotType,
  venue,
  confirmationDeadline,
  {
    comedianEmail: 'comedian@example.com',
    comedianName: 'John Doe',
    address: '123 Comedy St',
    promoterName: 'Jane Smith',
    promoterEmail: 'promoter@example.com',
    performanceDuration: '5 minutes',
    specialInstructions: 'No blue material'
  }
);
```

### Using Spot Confirmation Service
```typescript
import { spotConfirmationService } from '@/services/spotConfirmationService';

// Assign a spot
await spotConfirmationService.assignSpot({
  eventId: 'event-123',
  comedianId: 'comedian-456',
  spotType: 'MC',
  confirmationDeadline: '2024-01-15T10:00:00Z',
  performanceDuration: '5 minutes',
  specialInstructions: 'Open with crowd work'
});

// Confirm a spot
await spotConfirmationService.confirmSpot({
  eventId: 'event-123',
  comedianId: 'comedian-456',
  confirmed: true
});
```

## Database Schema

The system assumes the following database tables:

### `spot_assignments`
```sql
CREATE TABLE spot_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id),
  comedian_id uuid REFERENCES profiles(id),
  spot_type text NOT NULL,
  confirmation_deadline timestamptz NOT NULL,
  performance_duration text,
  special_instructions text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  confirmation_reason text,
  assigned_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### `notifications`
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  data jsonb,
  read boolean DEFAULT false,
  action_url text,
  action_label text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);
```

## Email Delivery

The system uses Supabase Edge Functions for email delivery:

```typescript
// Called automatically by notification service
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text
  }
});
```

## Styling Guidelines

### Colors
- **Success/Confirmed:** #28a745 (green)
- **Warning/Reminder:** #ffc107 (yellow)
- **Urgent/Declined:** #dc3545 (red)
- **Info/General:** #007bff (blue)

### Typography
- **Headers:** Segoe UI, 28px, weight 300
- **Body:** Segoe UI, 16px, line-height 1.6
- **Buttons:** 15px, weight 600, uppercase for urgent

### Layout
- **Max width:** 600px
- **Padding:** 30px standard, 20px mobile
- **Border radius:** 8px containers, 6px buttons
- **Shadows:** 0 2px 10px rgba(0,0,0,0.1)

## Error Handling

The notification system includes comprehensive error handling:

- Email delivery failures don't break the notification flow
- Database errors are logged and reported
- Fallback mechanisms for missing data
- Graceful degradation for optional features

## Testing

To test the notification system:

1. **Unit Tests:** Test individual notification methods
2. **Integration Tests:** Test complete workflow
3. **Email Tests:** Use email testing services
4. **UI Tests:** Test notification display

## Future Enhancements

- SMS notifications for urgent deadlines
- Push notifications for mobile apps
- Automated reminder scheduling
- Advanced email analytics
- Multi-language support
- Batch processing for large events