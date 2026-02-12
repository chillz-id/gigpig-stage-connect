export interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  canonical_full_name: string | null;
  mobile: string | null;
  phone: string | null;
  landline: string | null;
  location: string | null;
  marketing_opt_in: boolean | null;
  source: string | null;
  total_orders: number | null;
  total_spent: number | null;
  last_order_date: string | null;
  last_event_id: string | null;
  last_event_name: string | null;
  customer_segment: string | null;
  preferred_venue: string | null;
  mautic_contact_id: number | null;
  mautic_sync_status: string | null;
  mautic_last_sync: string | null;
  lead_score: number | null;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  last_scored_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  customer_since: string | null;
  date_of_birth: string | null;
  address: string | null;
  address_line1: string | null;
  address_line2: string | null;
  company: string | null;
  suburb: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  age_band: string | null;
  customer_segments: string[];
}

export interface CustomerFilters {
  search?: string;
  segments?: string[];
  minSpent?: number;
  maxSpent?: number;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
}

export interface CustomerSortOptions {
  column:
    | 'email'
    | 'first_name'
    | 'last_name'
    | 'total_orders'
    | 'total_spent'
    | 'last_order_date'
    | 'created_at'
    | 'customer_since'
    | 'updated_at'
    | 'customer_segment'
    | 'lead_score'
    | 'date_of_birth';
  ascending: boolean;
}

export type SegmentType = 'auto' | 'manual' | 'smart';

export interface SegmentCount {
  slug: string;
  name: string;
  color: string | null;
  description: string | null;
  segment_type: SegmentType;
  is_system: boolean;
  count: number;
}

export type CustomerProfileUpdates = Pick<
  Customer,
  | 'first_name'
  | 'last_name'
  | 'marketing_opt_in'
  | 'email'
  | 'mobile'
  | 'landline'
  | 'address_line1'
  | 'address_line2'
  | 'suburb'
  | 'city'
  | 'state'
  | 'postcode'
  | 'country'
> & {
  segments?: string[];
};

export interface SegmentDefinition {
  slug: string;
  name: string;
  color: string | null;
  description?: string | null;
  segment_type?: SegmentType;
  is_system?: boolean;
}

export interface CustomerStats {
  total_count: number;
  last_customer_since: string;
}
