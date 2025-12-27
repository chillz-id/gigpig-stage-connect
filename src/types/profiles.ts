// Extended profile types with first_name and last_name support

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  full_name?: string; // This will be auto-generated in the database
  email?: string;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  stage_name?: string | null;
  name_display_preference?: 'real' | 'stage' | 'both';
  years_experience?: number | null;
  custom_show_types?: string[] | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean | null;
  show_contact_in_epk?: boolean | null;
  profile_slug?: string | null;
}

export interface ProfileWithNames {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Auto-generated from first_name + last_name
  name?: string; // Legacy field for backward compatibility
  role: 'comedian' | 'admin';
  stage_name?: string | null;
  name_display_preference?: 'real' | 'stage' | 'both';
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean | null;
  custom_show_types?: string[] | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  show_contact_in_epk?: boolean | null;
  profile_slug?: string | null;
  created_at?: string;
  updated_at?: string;
}