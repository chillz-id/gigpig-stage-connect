
export interface Comedian {
  id: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  email: string | null;
  created_at?: string | null;
  years_experience?: number;
  show_count?: number;
  specialties?: string[];
  social_media?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
  // Contact fields added from database migration
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  show_contact_in_epk: boolean | null;
}
