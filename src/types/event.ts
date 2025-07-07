export interface Venue {
  id: string;
  name: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  capacity: number;
  website?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Generated column
  stage_name?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  role: 'comedian' | 'promoter' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface EventSpot {
  id: string;
  event_id: string;
  performer_id: string | null;
  order_number: number;
  performance_type: 'spot' | 'feature' | 'headline' | 'mc';
  duration_minutes: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  performer?: Profile;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  venue_id: string;
  venue?: Venue;
  stage_manager_id: string;
  stage_manager?: Profile;
  co_promoter_ids?: string[];
  status: 'draft' | 'published';
  ticket_price?: number;
  total_spots: number;
  event_type: 'open_mic' | 'showcase' | 'special';
  created_at: string;
  updated_at: string;
  // Computed fields
  event_spots?: EventSpot[];
  spots_count?: number;
  applications_count?: number;
  is_full?: boolean;
}

export interface CreateEventData {
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  venue_id: string;
  stage_manager_id?: string;
  co_promoter_ids?: string[];
  status?: 'draft' | 'published';
  ticket_price?: number;
  total_spots: number;
  event_type: 'open_mic' | 'showcase' | 'special';
  spots?: Array<{
    performer_id?: string;
    performance_type: 'spot' | 'feature' | 'headline' | 'mc';
    duration_minutes: number;
  }>;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

export interface EventFilters {
  status?: 'draft' | 'published';
  venue_id?: string;
  date_from?: string;
  date_to?: string;
  my_events?: boolean;
  event_type?: 'open_mic' | 'showcase' | 'special';
}

export interface EventApplication {
  id: string;
  event_id: string;
  event?: Event;
  comedian_id: string;
  comedian?: Profile;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}