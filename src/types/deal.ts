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
