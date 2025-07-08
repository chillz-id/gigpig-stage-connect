import { z } from 'zod';

// Password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Email validation
const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

// Sign up schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  role: z.enum(['comedian', 'promoter']).optional(),
  acceptTerms: z.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Sign in schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset schema
export const passwordResetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
  token: z.string().min(1, 'Reset token is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim()
    .optional(),
  
  stage_name: z.string()
    .max(100, 'Stage name must be less than 100 characters')
    .trim()
    .optional(),
  
  bio: z.string()
    .max(2000, 'Bio must be less than 2000 characters')
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  website: z.string()
    .url('Invalid website URL')
    .max(255, 'Website URL must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  social_media: z.object({
    instagram: z.string().max(100).optional(),
    twitter: z.string().max(100).optional(),
    facebook: z.string().max(100).optional(),
    youtube: z.string().max(100).optional(),
    tiktok: z.string().max(100).optional(),
  }).optional(),
  
  avatar_url: z.string()
    .url('Invalid avatar URL')
    .max(500, 'Avatar URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

// Comedian profile schema
export const comedianProfileSchema = profileUpdateSchema.extend({
  experience_years: z.number()
    .min(0, 'Experience years cannot be negative')
    .max(100, 'Experience years seems too high')
    .optional(),
  
  performance_style: z.array(z.string()).max(10, 'Maximum 10 styles allowed').optional(),
  
  topics: z.array(z.string()).max(20, 'Maximum 20 topics allowed').optional(),
  
  achievements: z.string()
    .max(2000, 'Achievements must be less than 2000 characters')
    .optional(),
  
  media_links: z.array(z.object({
    type: z.enum(['youtube', 'vimeo', 'instagram', 'tiktok', 'other']),
    url: z.string().url('Invalid media URL'),
    title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  })).max(20, 'Maximum 20 media links allowed').optional(),
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// Email change schema
export const changeEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, 'Password is required for verification'),
});

// User search schema
export const userSearchSchema = z.object({
  search: z.string().max(100).optional(),
  role: z.enum(['comedian', 'promoter', 'admin', 'member']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});