/**
 * Unified Event Types - Single Source of Truth
 * 
 * This file consolidates all event-related types to ensure consistency
 * between frontend and backend, with proper field naming conventions.
 */

import { z } from 'zod';
import { Tables } from '@/integrations/supabase/types';

// ============================================================================
// Database Type Exports
// ============================================================================

/** Database event row type */
export type DatabaseEvent = Tables<'events'>;

/** Database event insert type */
export type DatabaseEventInsert = Omit<DatabaseEvent, 'id' | 'created_at' | 'updated_at'>;

/** Database event update type */
export type DatabaseEventUpdate = Partial<DatabaseEventInsert>;

// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Event status enum
 */
export enum EventStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

/**
 * Event type enum
 */
export enum EventType {
  OPEN_MIC = 'open_mic',
  SHOWCASE = 'showcase',
  SPECIAL = 'special'
}

/**
 * Performance type enum for spots
 */
export enum PerformanceType {
  SPOT = 'spot',
  FEATURE = 'feature',
  HEADLINE = 'headline',
  MC = 'mc'
}

// ============================================================================
// Core Event Types
// ============================================================================

/**
 * Profile type for related entities
 */
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  stage_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  role?: string;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Venue type
 */
export interface Venue {
  id: string;
  name: string;
  address: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  capacity?: number;
  website?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Event spot type - represents a performance slot
 */
export interface EventSpot {
  id: string;
  event_id: string;
  comedian_id: string | null;
  spot_order: number;
  spot_name: string;
  performance_type?: PerformanceType;
  duration_minutes: number | null;
  is_paid: boolean;
  payment_amount: number | null;
  currency: string;
  is_filled: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  comedian?: Profile;
}

/**
 * Main Event type - the canonical representation
 */
export interface Event {
  // Core fields
  id: string;
  title: string;
  description?: string | null;
  
  // Date and time fields
  event_date: string; // ISO datetime string
  start_time: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  
  // Location fields
  venue: string;
  venue_id?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  
  // People and roles
  promoter_id: string;
  promoter?: Profile;
  
  // Event configuration
  status: EventStatus | string | null;
  type?: string | null;
  spots: number | null; // Total number of performance spots
  capacity?: number | null;
  
  // Financial fields
  ticket_price?: number | null;
  pay_per_comedian?: number | null;
  currency?: string | null;
  is_paid?: boolean | null;
  
  // Settings and restrictions
  is_verified_only?: boolean | null;
  allow_recording?: boolean | null;
  age_restriction?: string | null;
  dress_code?: string | null;
  requirements?: string | null;
  
  // Media
  banner_url?: string | null;
  image_url?: string | null;
  
  // Recurring event fields
  is_recurring?: boolean | null;
  recurrence_pattern?: string | null;
  parent_event_id?: string | null;
  recurrence_end_date?: string | null;
  series_id?: string | null;
  
  // Platform integration
  humanitix_event_id?: string | null;
  eventbrite_event_id?: string | null;
  xero_invoice_id?: string | null;

  // Sync-related fields (from session_complete)
  source?: 'humanitix' | 'eventbrite' | 'platform' | string | null;
  source_id?: string | null;
  canonical_session_source_id?: string | null;
  synced_at?: string | null;
  is_synced?: boolean | null;
  ticket_count?: number | null;
  gross_dollars?: number | null;
  net_dollars?: number | null;
  fees_dollars?: number | null;
  tax_dollars?: number | null;
  order_count?: number | null;
  last_order_at?: string | null;
  ticket_url?: string | null;
  ticket_popup_url?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  
  // Analytics fields
  tickets_sold?: number | null;
  filled_slots?: number | null;
  applied_spots?: number | null;
  total_revenue?: number | null;
  total_costs?: number | null;
  profit_margin?: number | null;
  settlement_status?: string | null;
  
  // Metadata
  created_at: string | null;
  updated_at: string | null;
  featured?: boolean | null;
  is_template?: boolean | null;
  template_name?: string | null;
  
  // Relations
  event_spots?: EventSpot[];
  applications?: EventApplication[];
  
  // Computed fields (not in database)
  spots_count?: number;
  applications_count?: number;
  is_full?: boolean;
  is_past?: boolean;
  days_until?: number | null;
  available_spots?: number;
}

/**
 * Event application type
 */
export interface EventApplication {
  id: string;
  event_id: string;
  comedian_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  message?: string | null;
  applied_at: string;
  responded_at?: string | null;
  spot_type?: string | null;
  availability_confirmed?: boolean | null;
  requirements_acknowledged?: boolean | null;
  // Relations
  event?: Event;
  comedian?: Profile;
}

// ============================================================================
// Form and Input Types
// ============================================================================

/**
 * Event creation input type
 */
export interface CreateEventInput {
  // Required fields
  title: string;
  event_date: string;
  start_time: string;
  venue: string;
  address: string;
  
  // Optional fields
  description?: string;
  end_time?: string;
  venue_id?: string;
  city?: string;
  state?: string;
  country?: string;
  promoter_id?: string;
  status?: EventStatus;
  type?: string;
  spots?: number;
  capacity?: number;
  ticket_price?: number;
  pay_per_comedian?: number;
  currency?: string;
  requirements?: string[];
  
  // Settings
  is_verified_only?: boolean;
  is_paid?: boolean;
  allow_recording?: boolean;
  age_restriction?: string;
  dress_code?: string;
  
  // Media
  banner_url?: string;
  image_url?: string;
  
  // Recurring event
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  
  // Platform integration
  humanitix_event_id?: string;
  eventbrite_event_id?: string;
  
  // Template
  is_template?: boolean;
  template_name?: string;
  
  // Event spots to create
  event_spots?: Array<{
    comedian_id?: string;
    performance_type: PerformanceType;
    duration_minutes: number;
    is_paid?: boolean;
    payment_amount?: number;
  }>;
}

/**
 * Event update input type
 */
export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

/**
 * Event form data type (for forms)
 */
export interface EventFormData {
  title: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  date: string;
  time: string;
  endTime: string;
  doorsTime?: string;
  type: string;
  spots: number;
  description: string;
  requirements: string[];
  isVerifiedOnly: boolean;
  isPaid: boolean;
  allowRecording: boolean;
  ageRestriction: string;
  dresscode: string;
  imageUrl: string;
  bannerPosition?: { x: number; y: number; scale: number };
  showLevel: string;
  showType: string;
  customShowType: string;
  ticketingType: 'internal' | 'external';
  externalTicketUrl?: string;
  tickets?: EventTicket[];
  feeHandling?: 'absorb' | 'pass_to_customer';
  capacity: number;
}

/**
 * Event ticket type
 */
export interface EventTicket {
  ticket_name: string;
  description?: string;
  price: number;
  currency: string;
  quantity?: number;
}

/**
 * Event filter type
 */
export interface EventFilters {
  status?: EventStatus;
  venue_id?: string;
  date_from?: string;
  date_to?: string;
  my_events?: boolean;
  event_type?: EventType;
  search?: string;
  has_spots?: boolean;
  is_private?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Event validation schema
 */
export const eventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(5000).optional().nullable(),
  event_date: z.string(),
  start_time: z.string(),
  end_time: z.string().optional().nullable(),
  venue: z.string(),
  venue_id: z.string().uuid().optional().nullable(),
  address: z.string(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  promoter_id: z.string().uuid(),
  status: z.nativeEnum(EventStatus).optional().nullable(),
  type: z.string().optional().nullable(),
  spots: z.number().min(0).optional().nullable(),
  capacity: z.number().min(1).optional().nullable(),
  ticket_price: z.number().min(0).optional().nullable(),
  pay_per_comedian: z.number().min(0).optional().nullable(),
  currency: z.string().default('AUD').optional().nullable(),
  is_verified_only: z.boolean().optional().nullable(),
  is_paid: z.boolean().optional().nullable(),
  allow_recording: z.boolean().optional().nullable(),
  age_restriction: z.string().optional().nullable(),
  dress_code: z.string().optional().nullable(),
  requirements: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});

/**
 * Create event validation schema
 */
export const createEventSchema = eventSchema.omit({ 
  promoter_id: true 
}).extend({
  promoter_id: z.string().uuid().optional(),
  event_spots: z.array(z.object({
    comedian_id: z.string().uuid().optional(),
    performance_type: z.nativeEnum(PerformanceType),
    duration_minutes: z.number().min(5).max(60),
    is_paid: z.boolean().optional(),
    payment_amount: z.number().min(0).optional(),
  })).optional(),
});

/**
 * Update event validation schema
 */
export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Event application validation schema
 */
export const eventApplicationSchema = z.object({
  event_id: z.string().uuid(),
  message: z.string().min(10).max(1000).trim(),
  availability_confirmed: z.boolean().refine(val => val === true),
  requirements_acknowledged: z.boolean().optional(),
  spot_type: z.string().optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert database event to domain event
 */
export function toDomainEvent(dbEvent: DatabaseEvent): Event {
  return {
    ...dbEvent,
    // Ensure consistent field naming
    spots: dbEvent.spots ?? dbEvent.comedian_slots ?? 0,
    // Add computed fields
    available_spots: calculateAvailableSpots(dbEvent),
    is_past: new Date(dbEvent.event_date) < new Date(),
    days_until: calculateDaysUntil(dbEvent.event_date),
  };
}

/**
 * Convert form data to create event input
 */
export function formDataToCreateInput(formData: EventFormData): CreateEventInput {
  return {
    title: formData.title,
    venue: formData.venue,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    country: formData.country,
    event_date: new Date(`${formData.date}T${formData.time}`).toISOString(),
    start_time: formData.time,
    end_time: formData.endTime || undefined,
    type: formData.type,
    spots: formData.spots,
    description: formData.description,
    requirements: formData.requirements,
    is_verified_only: formData.isVerifiedOnly,
    is_paid: formData.isPaid,
    allow_recording: formData.allowRecording,
    age_restriction: formData.ageRestriction,
    dress_code: formData.dresscode,
    image_url: formData.imageUrl || undefined,
    capacity: formData.capacity,
  };
}

/**
 * Calculate available spots
 */
function calculateAvailableSpots(event: DatabaseEvent): number {
  const totalSpots = event.spots ?? event.comedian_slots ?? 0;
  const filledSpots = event.filled_slots ?? 0;
  return Math.max(0, totalSpots - filledSpots);
}

/**
 * Calculate days until event
 */
function calculateDaysUntil(eventDate: string): number | null {
  const date = new Date(eventDate);
  const now = new Date();
  if (date < now) return null;
  
  const diffTime = Math.abs(date.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a valid event status
 */
export function isEventStatus(value: unknown): value is EventStatus {
  return Object.values(EventStatus).includes(value as EventStatus);
}

/**
 * Check if value is a valid event type
 */
export function isEventType(value: unknown): value is EventType {
  return Object.values(EventType).includes(value as EventType);
}

/**
 * Check if value is a valid performance type
 */
export function isPerformanceType(value: unknown): value is PerformanceType {
  return Object.values(PerformanceType).includes(value as PerformanceType);
}