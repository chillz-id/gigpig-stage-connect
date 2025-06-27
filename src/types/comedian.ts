
export interface Comedian {
  id: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  email: string | null;
  years_experience?: number;
  show_count?: number;
  specialties?: string[];
  social_media?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
}
