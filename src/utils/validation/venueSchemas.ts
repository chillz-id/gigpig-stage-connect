import { z } from 'zod';

// Venue schema
export const venueSchema = z.object({
  name: z.string()
    .min(2, 'Venue name must be at least 2 characters')
    .max(100, 'Venue name must be less than 100 characters')
    .trim(),
  
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters')
    .trim(),
  
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters')
    .trim(),
  
  state: z.string()
    .length(3, 'State must be 3 characters (e.g., NSW)')
    .toUpperCase(),
  
  postcode: z.string()
    .regex(/^\d{4}$/, 'Postcode must be 4 digits'),
  
  capacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(100000, 'Capacity seems too high')
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
  
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  
  amenities: z.array(z.string()).max(50, 'Maximum 50 amenities allowed').optional(),
  
  parking_info: z.string()
    .max(500, 'Parking info must be less than 500 characters')
    .optional(),
  
  public_transport: z.string()
    .max(500, 'Public transport info must be less than 500 characters')
    .optional(),
  
  latitude: z.number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude')
    .optional(),
  
  longitude: z.number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude')
    .optional(),
  
  google_place_id: z.string()
    .max(255, 'Place ID must be less than 255 characters')
    .optional(),
  
  images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').optional(),
});

// Create venue schema
export const createVenueSchema = venueSchema;

// Update venue schema
export const updateVenueSchema = venueSchema.partial();

// Venue search schema
export const venueSearchSchema = z.object({
  search: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(3).optional(),
  min_capacity: z.number().min(0).optional(),
  max_capacity: z.number().min(0).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Vouch schema
export const vouchSchema = z.object({
  vouch_for_id: z.string().uuid('Invalid user ID'),
  
  message: z.string()
    .min(20, 'Vouch message must be at least 20 characters')
    .max(1000, 'Vouch message must be less than 1000 characters')
    .trim(),
  
  relationship: z.enum(['worked_with', 'seen_perform', 'know_personally', 'other'])
    .default('worked_with'),
  
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
});

// Message schema
export const messageSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient ID'),
  
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must be less than 200 characters')
    .trim()
    .optional(),
  
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be less than 5000 characters')
    .trim(),
  
  event_id: z.string().uuid().optional(),
  
  spot_id: z.string().uuid().optional(),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean().default(true),
  
  push_notifications: z.boolean().default(true),
  
  sms_notifications: z.boolean().default(false),
  
  notification_types: z.object({
    event_updates: z.boolean().default(true),
    application_updates: z.boolean().default(true),
    messages: z.boolean().default(true),
    vouches: z.boolean().default(true),
    reminders: z.boolean().default(true),
    marketing: z.boolean().default(false),
  }),
  
  quiet_hours: z.object({
    enabled: z.boolean().default(false),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }).optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 50 * 1024 * 1024, 'File must be less than 50MB'),
  
  type: z.enum(['image', 'video', 'document']),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});