import { Profile } from './auth';

export interface PhotographerProfile extends Profile {
  photographer_profile?: {
    id: string;
    specialties: string[];
    experience_years: number | null;
    equipment: string | null;
    portfolio_url: string | null;
    rate_per_hour: number | null;
    rate_per_event: number | null;
    travel_radius_km: number;
    services_offered: string[];
    turnaround_time_days: number | null;
    instagram_portfolio: string | null;
    available_for_events: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface PhotographerAvailability {
  id: string;
  photographer_id: string;
  date: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  photographer_id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  event_type: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventPhotographer {
  id: string;
  event_id: string;
  photographer_id: string;
  role: 'photographer' | 'videographer' | 'both';
  status: 'pending' | 'confirmed' | 'cancelled';
  rate_agreed: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  photographer?: PhotographerProfile;
  event?: any; // Will be Event type when needed
}

// Vouch types for photographers (using existing vouch system)
export interface PhotographerVouchStats {
  photographer_id: string;
  total_vouches: number;
  unique_vouchers: number;
  average_rating: number;
  recent_vouches: number;
}

export interface PhotographerVouch {
  id: string;
  voucher_id: string;
  voucher_name: string;
  voucher_avatar_url: string | null;
  voucher_role: string | null;
  message: string | null;
  rating: number;
  relationship: string | null;
  created_at: string;
  event_id: string | null;
  event_title: string | null;
}

export const PHOTOGRAPHER_SPECIALTIES = [
  'Event Photography',
  'Portrait Photography',
  'Headshots',
  'Live Performance',
  'Behind the Scenes',
  'Promotional Materials',
  'Social Media Content',
  'Video Recording',
  'Live Streaming',
  'Documentary Style',
  'Editorial',
  'Commercial'
] as const;

export const PHOTOGRAPHER_SERVICES = [
  'event_photography',
  'headshots',
  'video_recording',
  'live_streaming',
  'photo_editing',
  'video_editing',
  'same_day_delivery',
  'social_media_packages',
  'promotional_materials',
  'behind_the_scenes'
] as const;

export type PhotographerSpecialty = typeof PHOTOGRAPHER_SPECIALTIES[number];
export type PhotographerService = typeof PHOTOGRAPHER_SERVICES[number];

export interface PhotographerFilters {
  search?: string;
  specialties?: string[];
  services?: string[];
  available_date?: string;
  max_rate?: number;
  location?: string;
  available_for_events?: boolean;
  sortBy?: 'name' | 'experience' | 'vouches' | 'rate';
}