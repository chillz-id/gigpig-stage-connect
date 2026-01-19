/**
 * Spot/Lineup related types and interfaces
 */

export type SpotType = 'MC' | 'Feature' | 'Headliner' | 'Guest';
export type SpotStatus = 'available' | 'assigned' | 'confirmed' | 'cancelled';
export type SpotCategory = 'act' | 'doors' | 'intermission' | 'custom';

/** Distinguishes comedian/performer spots from production staff spots */
export type SpotKind = 'act' | 'extra';

/** Types of production/extra staff */
export type ExtraType = 'photographer' | 'videographer' | 'door_staff' | 'audio_tech' | 'lighting_tech';

/** Payment rate type for extras */
export type RateType = 'hourly' | 'flat';

/** GST handling type for line items */
export type GstType = 'excluded' | 'included' | 'addition';

/** GST rate (10% in Australia) */
export const GST_RATE = 0.10;

/** Start time mode for breaks - whether the break counts toward show runtime */
export type StartTimeMode = 'included' | 'before';

/** Display labels for extra types */
export const EXTRA_TYPE_LABELS: Record<ExtraType, string> = {
  photographer: 'Photographer',
  videographer: 'Videographer',
  door_staff: 'Door Staff',
  audio_tech: 'Audio Tech',
  lighting_tech: 'Lighting Tech',
};

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
  payment_gst_type?: GstType;
  status: SpotStatus;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Extra staff fields
  /** 'act' for comedians, 'extra' for production staff */
  spot_type?: SpotKind;
  /** ID of the production staff or visual artist */
  staff_id?: string;
  /** Type of extra staff */
  extra_type?: ExtraType;
  /** Payment rate type: hourly or flat */
  rate_type?: RateType;
  /** Duration in hours for hourly rate calculation */
  hours?: number;
  /** Denormalized staff name for display */
  staff_name?: string;
  /** Denormalized staff avatar URL */
  staff_avatar?: string;
  /** For breaks: 'included' = counts toward runtime, 'before' = happens before show starts */
  start_time_mode?: StartTimeMode;
  /** Scheduled start time for extras (e.g., "20:00" for 8pm) - independent of show start */
  scheduled_start_time?: string;
}

export interface SpotInsert {
  event_id: string;
  position: number;
  type?: SpotType;
  category?: SpotCategory;
  label?: string;
  comedian_id?: string;
  payment_amount?: number;
  payment_gst_type?: GstType;
  status?: SpotStatus;
  duration_minutes?: number;
  notes?: string;
  // Extra staff fields
  spot_type?: SpotKind;
  staff_id?: string;
  extra_type?: ExtraType;
  rate_type?: RateType;
  hours?: number;
  staff_name?: string;
  staff_avatar?: string;
  // Break timing
  start_time_mode?: StartTimeMode;
  // Extra scheduled start time
  scheduled_start_time?: string;
}

export interface SpotUpdate {
  position?: number;
  type?: SpotType;
  category?: SpotCategory;
  label?: string;
  comedian_id?: string;
  payment_amount?: number;
  payment_gst_type?: GstType;
  status?: SpotStatus;
  duration_minutes?: number;
  notes?: string;
  // Extra staff fields
  spot_type?: SpotKind;
  staff_id?: string;
  extra_type?: ExtraType;
  rate_type?: RateType;
  hours?: number;
  staff_name?: string;
  staff_avatar?: string;
  // Break timing
  start_time_mode?: StartTimeMode;
  // Extra scheduled start time
  scheduled_start_time?: string;
}

/** Template spot definition (without comedian/staff assignments) */
export interface LineupTemplateSpot {
  position: number;
  spot_type?: SpotKind;
  category: SpotCategory;
  type?: SpotType; // For acts: MC, Feature, Headliner, Spot, Guest
  extra_type?: ExtraType; // For extras
  label?: string; // For breaks: "Doors Open", "Intermission"
  duration_minutes: number;
  payment_amount?: number;
  payment_gst_type?: GstType; // GST handling for payment
  rate_type?: RateType; // For extras
  hours?: number; // For hourly extras
  start_time_mode?: StartTimeMode; // For breaks
  scheduled_start_time?: string; // For extras with specific start time
  notes?: string;
}

/** Lineup template metadata */
export interface LineupTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  spots: LineupTemplateSpot[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/** Production staff profile data */
export interface ProductionStaffProfile {
  id: string;
  user_id: string;
  specialty: 'door_staff' | 'audio_tech' | 'lighting_tech' | 'stage_manager' | 'other';
  specialty_other?: string;
  hourly_rate?: number;
  flat_rate?: number;
  experience_years?: number;
  bio?: string;
  availability_notes?: string;
  is_available?: boolean;
  created_at: string;
  updated_at: string;
}

/** Line item for payment breakdown per spot (Fee, Travel, Merch, etc.) */
export interface SpotLineItem {
  id: string;
  event_spot_id: string;
  label: string;        // "Fee", "Travel Allowance", "Merch"
  amount: number;       // Positive = income, negative = deduction
  gst_type: GstType;    // How GST is handled: excluded, included, or addition
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SpotLineItemInsert {
  event_spot_id: string;
  label: string;
  amount: number;
  gst_type?: GstType;
  display_order?: number;
}

export interface SpotLineItemUpdate {
  label?: string;
  amount?: number;
  gst_type?: GstType;
  display_order?: number;
}

/** Common presets for quick entry of line items */
export const LINE_ITEM_PRESETS = [
  { label: 'Fee', gst_type: 'addition' as GstType, description: 'Performance or service fee' },
  { label: 'Travel Allowance', gst_type: 'excluded' as GstType, description: 'Travel reimbursement' },
  { label: 'Parking', gst_type: 'excluded' as GstType, description: 'Parking reimbursement' },
  { label: 'Accommodation', gst_type: 'excluded' as GstType, description: 'Hotel or lodging' },
  { label: 'Merch', gst_type: 'excluded' as GstType, description: 'Merchandise deduction (use negative)' },
  { label: 'Commission', gst_type: 'addition' as GstType, description: 'Agency commission (use negative)' },
] as const;

export type LineItemPreset = (typeof LINE_ITEM_PRESETS)[number];
