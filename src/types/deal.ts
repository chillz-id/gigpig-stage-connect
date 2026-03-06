/**
 * Deal/Financial related types and interfaces
 */

export type DealStatus = 'pending' | 'confirmed' | 'rejected';
export type ParticipantStatus = 'pending' | 'confirmed' | 'rejected';

export interface ParticipantData {
  id: string;
  deal_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  split_amount: number;
  split_percentage: number;
  status: ParticipantStatus;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DealData {
  id: string;
  event_id: string;
  title: string;
  total_amount: number;
  status: DealStatus;
  participants: ParticipantData[];
  created_by: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  rejected_at?: string;
}

export interface DealInsert {
  event_id: string;
  title: string;
  total_amount: number;
  created_by: string;
  participants: Array<{
    user_id: string;
    split_amount: number;
    split_percentage: number;
  }>;
}

export interface DealUpdate {
  title?: string;
  total_amount?: number;
  status?: DealStatus;
}

export interface SplitParticipant {
  id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  split_amount: number;
  split_percentage: number;
}

// Series deal participant (linked via series_deal_id instead of deal_id)
export interface SeriesDealParticipant {
  id: string;
  series_deal_id: string;
  participant_id?: string;
  participant_email?: string;
  participant_type: 'comedian' | 'manager' | 'organization' | 'venue' | 'promoter' | 'other';
  split_type: 'percentage' | 'flat_fee' | 'door_split' | 'tiered' | 'custom';
  split_percentage?: number;
  flat_fee_amount?: number;
  gst_mode: 'inclusive' | 'exclusive' | 'none';
  approval_status: 'pending' | 'approved' | 'edited' | 'declined';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined profile data
  participant?: {
    id: string;
    name: string;
    avatar_url?: string;
    email?: string;
  };
}

export type DealFrequency = 'per_event' | 'weekly' | 'fortnightly' | 'monthly';

export interface SeriesDealRevenue {
  series_deal_id: string;
  total_revenue: number;
  settled_revenue: number;
  pending_revenue: number;
  event_count: number;
  per_participant: Array<{
    participant_id: string;
    participant_name: string;
    earned: number;
    settled: number;
    pending: number;
  }>;
}
