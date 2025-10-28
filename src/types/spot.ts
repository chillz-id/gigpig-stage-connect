/**
 * Spot/Lineup related types and interfaces
 */

export type SpotType = 'MC' | 'Feature' | 'Headliner' | 'Guest';
export type SpotStatus = 'available' | 'assigned' | 'confirmed' | 'cancelled';

export interface SpotData {
  id: string;
  event_id: string;
  position: number;
  time: string;
  type: SpotType;
  comedian_id?: string;
  comedian_name?: string;
  comedian_avatar?: string;
  payment_amount?: number;
  status: SpotStatus;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SpotInsert {
  event_id: string;
  position: number;
  time: string;
  type: SpotType;
  comedian_id?: string;
  payment_amount?: number;
  status?: SpotStatus;
  duration_minutes?: number;
  notes?: string;
}

export interface SpotUpdate {
  position?: number;
  time?: string;
  type?: SpotType;
  comedian_id?: string;
  payment_amount?: number;
  status?: SpotStatus;
  duration_minutes?: number;
  notes?: string;
}
