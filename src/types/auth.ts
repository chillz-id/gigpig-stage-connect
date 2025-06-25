
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
  membership: string;
  has_comedian_pro_badge: boolean;
  has_promoter_pro_badge: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'comedian' | 'promoter' | 'admin';
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
  hasRole: (role: 'comedian' | 'promoter' | 'admin') => boolean;
}
