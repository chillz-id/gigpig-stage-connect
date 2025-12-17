/**
 * Spot/Lineup related types and interfaces
 */

export type SpotType = 'MC' | 'Feature' | 'Headliner' | 'Guest';
export type SpotStatus = 'available' | 'assigned' | 'confirmed' | 'cancelled';
export type SpotCategory = 'act' | 'doors' | 'intermission' | 'custom';

export interface SpotData {
  id: string;
  event_id: string;
  position: number;
  /** Calculated start time (computed from event start + cumulative durations) */
  start_time?: string;
  type: SpotType;
  /** Category: act, doors, intermission, or custom break */
  category: SpotCategory;
  /** Label for breaks (e.g., "Doors Open", "Intermission", custom name) */
  label?: string;
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
  type?: SpotType;
  category?: SpotCategory;
  label?: string;
  comedian_id?: string;
  payment_amount?: number;
  status?: SpotStatus;
  duration_minutes?: number;
  notes?: string;
}

export interface SpotUpdate {
  position?: number;
  type?: SpotType;
  category?: SpotCategory;
  label?: string;
  comedian_id?: string;
  payment_amount?: number;
  status?: SpotStatus;
  duration_minutes?: number;
  notes?: string;
}
