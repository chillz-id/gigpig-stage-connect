
import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  stage_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  show_contact_in_epk: boolean;
  custom_show_types: string[];
  profile_slug: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'guest' | 'member' | 'comedian' | 'promoter' | 'co_promoter' | 'admin';
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  isLoading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  hasRole: (role: 'guest' | 'member' | 'comedian' | 'promoter' | 'co_promoter' | 'admin') => boolean;
  isCoPromoterForEvent: (eventId: string) => Promise<boolean>;
}
