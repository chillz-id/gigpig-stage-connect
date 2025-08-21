import { z } from 'zod';

// Base event schema
export const eventBaseSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  
  date: z.string().datetime('Invalid date format'),
  
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  
  duration_minutes: z.number()
    .min(30, 'Duration must be at least 30 minutes')
    .max(480, 'Duration must be less than 8 hours'),
  
  venue_id: z.string().uuid('Invalid venue ID'),
  
  type: z.enum(['open_mic', 'showcase', 'headliner', 'workshop', 'other']),
  
  status: z.enum(['draft', 'open', 'closed', 'cancelled', 'completed']).default('draft'),
  
  capacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity seems too high')
    .optional(),
  
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(1000, 'Price seems too high')
    .optional(),
  
  is_private: z.boolean().default(false),
  
  allow_applications: z.boolean().default(true),
  
  application_deadline: z.string().datetime().optional(),
  
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
});

// Event creation schema
export const createEventSchema = eventBaseSchema.omit({ status: true });

// Event update schema
export const updateEventSchema = eventBaseSchema.partial();

// Event spot schema
export const eventSpotSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  
  spot_number: z.number()
    .min(1, 'Spot number must be at least 1')
    .max(100, 'Spot number seems too high'),
  
  duration_minutes: z.number()
    .min(5, 'Duration must be at least 5 minutes')
    .max(60, 'Duration must be less than 60 minutes'),
  
  performer_id: z.string().uuid('Invalid performer ID').optional(),
  
  type: z.enum(['open', 'showcase', 'headliner', 'feature', 'mc']).default('open'),
  
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Batch spot creation schema
export const createEventSpotsSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  spots: z.array(eventSpotSchema.omit({ event_id: true })).min(1).max(50),
});

// Event search/filter schema
export const eventFiltersSchema = z.object({
  search: z.string().max(100).optional(),
  type: z.enum(['open_mic', 'showcase', 'headliner', 'workshop', 'other']).optional(),
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
  venue_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  has_spots: z.boolean().optional(),
  is_private: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Event application schema
export const eventApplicationSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  
  spot_id: z.string().uuid('Invalid spot ID').optional(),
  
  message: z.string()
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
    .optional(),
  
  spot_type: z.enum(['MC', 'Feature', 'Headliner', 'Guest'])
    .default('Feature'),
  
  availability_confirmed: z.boolean()
    .refine(val => val === true, 'You must confirm your availability'),
  
  requirements_acknowledged: z.boolean()
    .refine(val => val === true, 'You must acknowledge event requirements'),
  
  tech_requirements: z.string()
    .max(500, 'Tech requirements must be less than 500 characters')
    .optional(),
});

// Event publishing schema
export const publishEventSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  
  confirm_details: z.boolean()
    .refine(val => val === true, 'You must confirm event details are correct'),
  
  confirm_venue: z.boolean()
    .refine(val => val === true, 'You must confirm venue booking'),
  
  notify_performers: z.boolean().default(true),
});