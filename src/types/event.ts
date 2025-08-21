/**
 * @deprecated This file is deprecated. Use '@/types/events.unified' instead.
 * 
 * This file re-exports from the unified event types for backward compatibility.
 * All new code should import directly from events.unified.ts
 */

export * from './events.unified';

// Legacy type aliases for backward compatibility
import type { 
  Event as UnifiedEvent,
  CreateEventInput,
  UpdateEventInput,
  EventApplication as UnifiedEventApplication,
  EventSpot as UnifiedEventSpot,
  Profile as UnifiedProfile,
  Venue as UnifiedVenue,
  EventFormData,
  EventFilters as UnifiedEventFilters
} from './events.unified';

// Re-export with legacy names
export type Event = UnifiedEvent;
export type CreateEventData = CreateEventInput;
export type UpdateEventData = UpdateEventInput;
export type EventApplication = UnifiedEventApplication;
export type EventSpot = UnifiedEventSpot;
export type Profile = UnifiedProfile;
export type Venue = UnifiedVenue;
export type EventFilters = UnifiedEventFilters;

// Legacy form type
export interface EventWaitlistEntry {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitlistFormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
}