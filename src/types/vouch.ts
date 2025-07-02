export interface Vouch {
  id: string;
  voucher_id: string;
  vouchee_id: string;
  message: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface VouchWithProfiles {
  id: string;
  voucher_id: string;
  vouchee_id: string;
  message: string;
  rating: number;
  created_at: string;
  updated_at: string;
  voucher_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    stage_name?: string;
  };
  vouchee_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    stage_name?: string;
  };
}

export interface VouchFormData {
  vouchee_id: string;
  message: string;
  rating: number;
}

export interface VouchStats {
  total_given: number;
  total_received: number;
  average_rating_received: number;
  recent_vouches_received: number;
}

export interface UserSearchResult {
  id: string;
  name: string;
  stage_name?: string;
  avatar_url?: string;
  roles: string[];
}