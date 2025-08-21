import { z } from 'zod';

// Re-export all schemas
export * from './eventSchemas';
export * from './userSchemas';
export * from './venueSchemas';

// Common validation utilities
export const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

// Common field schemas that can be reused
export const commonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  
  url: z.string()
    .url('Invalid URL format')
    .max(500, 'URL must be less than 500 characters'),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  
  date: z.string().datetime('Invalid date format'),
  
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  
  currency: z.number()
    .min(0, 'Amount cannot be negative')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  
  percentage: z.number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100'),
  
  positiveInteger: z.number()
    .int('Must be a whole number')
    .positive('Must be a positive number'),
  
  nonEmptyString: z.string()
    .min(1, 'This field cannot be empty')
    .transform(sanitizeString),
  
  optionalString: z.string()
    .transform(sanitizeString)
    .optional()
    .or(z.literal('')),
};

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Generic search schema
export const searchSchema = z.object({
  query: z.string().max(200, 'Search query too long').optional(),
  filters: z.record(z.unknown()).optional(),
}).merge(paginationSchema);

// Safe parse with error formatting
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Format errors for easy display
  const errors: Record<string, string> = {};
  result.error.errors.forEach(error => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return { success: false, errors };
}

// Validate and throw with formatted error
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = safeParse(schema, data);
  
  if (!result.success) {
    const errorMessage = Object.entries(result.errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
    throw new Error(`Validation failed: ${errorMessage}`);
  }
  
  return result.data;
}

// React Hook Form resolver
export function zodResolver<T extends z.ZodSchema>(schema: T) {
  return async (data: unknown) => {
    const result = safeParse(schema, data);
    
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    
    return {
      values: {},
      errors: Object.entries(result.errors).reduce((acc, [path, message]) => {
        const keys = path.split('.');
        let current: any = acc;
        
        keys.forEach((key, index) => {
          if (index === keys.length - 1) {
            current[key] = { message };
          } else {
            current[key] = current[key] || {};
            current = current[key];
          }
        });
        
        return acc;
      }, {} as any),
    };
  };
}