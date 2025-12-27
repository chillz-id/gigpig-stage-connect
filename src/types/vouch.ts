export interface Vouch {
  id: string;
  voucher_id: string;
  vouchee_id: string;
  message: string;
  rating?: number;
  organization_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationProfile {
  id: string;
  display_name: string;
  logo_url?: string | null;
  organization_type?: string[] | null;
}

export interface VouchWithProfiles {
  id: string;
  voucher_id: string;
  vouchee_id: string;
  message: string;
  rating?: number;
  organization_id?: string | null;
  created_at: string;
  updated_at: string;
  voucher_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    stage_name?: string;
    roles?: string[];
  };
  vouchee_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    stage_name?: string;
    roles?: string[];
  };
  // Organization profile when vouch was given on behalf of an org
  organization_profile?: OrganizationProfile | null;
}

export interface VouchFormData {
  vouchee_id: string;
  message: string;
  rating?: number;
  // When set, the vouch is given on behalf of an organization
  organization_id?: string | null;
}

export interface VouchStats {
  total_given: number;
  total_received: number;
  recent_vouches_received: number;
}

export interface UserSearchResult {
  id: string;
  name: string;
  stage_name?: string;
  avatar_url?: string;
  roles: string[];
  type?: 'profile' | 'organization';
}