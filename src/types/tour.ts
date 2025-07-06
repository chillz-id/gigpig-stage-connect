// Tour Management System Types
// Complete TypeScript interfaces for the comprehensive touring system

export type TourStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type TourStopStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled' | 'postponed';
export type ParticipantRole = 'headliner' | 'support_act' | 'opener' | 'mc' | 'crew' | 'management' | 'guest' | 'local_talent';
export type CollaborationRole = 'co_promoter' | 'local_promoter' | 'sponsor' | 'partner' | 'venue_partner' | 'media_partner';
export type CollaborationStatus = 'invited' | 'confirmed' | 'active' | 'completed' | 'declined' | 'terminated';
export type LogisticsType = 'transportation' | 'accommodation' | 'equipment' | 'catering' | 'security' | 'marketing' | 'technical';
export type PaymentType = 'per_show' | 'tour_total' | 'percentage' | 'flat_rate' | 'revenue_share';

// Base tour interface
export interface Tour {
  id: string;
  name: string;
  description?: string;
  tour_manager_id: string;
  agency_id?: string;
  start_date?: string;
  end_date?: string;
  status: TourStatus;
  tour_type: string;
  budget?: number;
  estimated_revenue?: number;
  actual_revenue: number;
  currency: string;
  revenue_sharing: Record<string, any>;
  marketing_budget?: number;
  marketing_materials: Record<string, any>;
  social_hashtag?: string;
  website_url?: string;
  booking_contact_email?: string;
  booking_contact_phone?: string;
  emergency_contact: Record<string, any>;
  tour_requirements: Record<string, any>;
  travel_policy: Record<string, any>;
  cancellation_policy?: string;
  insurance_info: Record<string, any>;
  contract_template_id?: string;
  is_public: boolean;
  promotional_code?: string;
  total_capacity: number;
  tickets_sold: number;
  gross_sales: number;
  created_at: string;
  updated_at: string;
}

// Tour stop/show interface
export interface TourStop {
  id: string;
  tour_id: string;
  venue_name: string;
  venue_address?: string;
  venue_city: string;
  venue_state?: string;
  venue_country: string;
  venue_contact: Record<string, any>;
  venue_capacity?: number;
  event_date: string;
  doors_open?: string;
  show_time: string;
  show_duration_minutes: number;
  soundcheck_time?: string;
  load_in_time?: string;
  load_out_time?: string;
  status: TourStopStatus;
  ticket_price?: number;
  vip_price?: number;
  tickets_available?: number;
  tickets_sold: number;
  revenue: number;
  expenses: number;
  technical_requirements: Record<string, any>;
  catering_requirements: Record<string, any>;
  accommodation_info: Record<string, any>;
  local_contacts: Record<string, any>;
  parking_info?: string;
  accessibility_info?: string;
  covid_requirements?: string;
  order_index: number;
  travel_time_to_next?: number;
  distance_to_next_km?: number;
  notes?: string;
  weather_backup_plan?: string;
  created_at: string;
  updated_at: string;
}

// Tour participant interface
export interface TourParticipant {
  id: string;
  tour_id: string;
  user_id?: string;
  participant_name: string;
  role: ParticipantRole;
  join_date?: string;
  leave_date?: string;
  specific_shows?: string[];
  payment_rate?: number;
  payment_type: PaymentType;
  payment_terms: string;
  travel_covered: boolean;
  accommodation_covered: boolean;
  meals_covered: boolean;
  meal_allowance?: number;
  equipment_provided: boolean;
  special_requirements: Record<string, any>;
  contract_signed: boolean;
  contract_file_url?: string;
  emergency_contact: Record<string, any>;
  bio?: string;
  photo_url?: string;
  social_media: Record<string, any>;
  performance_notes?: string;
  is_headliner: boolean;
  performance_order?: number;
  stage_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

// Tour itinerary interface
export interface TourItinerary {
  id: string;
  tour_id: string;
  tour_stop_id?: string;
  date: string;
  start_time: string;
  end_time?: string;
  activity_type: string;
  title: string;
  location?: string;
  address?: string;
  duration_minutes?: number;
  responsible_person?: string;
  participants?: string[];
  notes?: string;
  equipment_needed?: string[];
  transportation_method?: string;
  confirmation_required: boolean;
  confirmed: boolean;
  confirmed_by?: string;
  confirmed_at?: string;
  status: string;
  order_index: number;
  weather_dependent: boolean;
  backup_plan?: string;
  cost?: number;
  created_at: string;
  updated_at: string;
}

// Tour logistics interface
export interface TourLogistics {
  id: string;
  tour_id: string;
  tour_stop_id?: string;
  type: LogisticsType;
  provider_name?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  booking_reference?: string;
  confirmation_number?: string;
  cost?: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  participants?: string[];
  details: Record<string, any>;
  requirements: Record<string, any>;
  status: string;
  payment_status: string;
  payment_due_date?: string;
  cancellation_policy?: string;
  modification_policy?: string;
  notes?: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

// Tour collaboration interface
export interface TourCollaboration {
  id: string;
  tour_id: string;
  collaborator_id: string;
  role: CollaborationRole;
  status: CollaborationStatus;
  responsibilities?: string[];
  revenue_share?: number;
  expense_share?: number;
  specific_shows?: string[];
  marketing_contribution: Record<string, any>;
  venue_connections: Record<string, any>;
  local_knowledge?: string;
  contact_priority: number;
  decision_making_power: boolean;
  financial_responsibility?: number;
  contract_terms: Record<string, any>;
  signed_agreement: boolean;
  agreement_file_url?: string;
  invitation_sent_at?: string;
  invitation_expires_at?: string;
  responded_at?: string;
  joined_at?: string;
  left_at?: string;
  termination_reason?: string;
  performance_rating?: number;
  would_collaborate_again?: boolean;
  collaboration_notes?: string;
  created_at: string;
  updated_at: string;
}

// Tour expense interface
export interface TourExpense {
  id: string;
  tour_id: string;
  tour_stop_id?: string;
  logistics_id?: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  paid_by?: string;
  reimbursable: boolean;
  reimbursed: boolean;
  reimbursed_date?: string;
  receipt_url?: string;
  vendor_name?: string;
  vendor_contact?: string;
  payment_method?: string;
  tax_deductible: boolean;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

// Tour revenue interface
export interface TourRevenue {
  id: string;
  tour_id: string;
  tour_stop_id?: string;
  revenue_type: string;
  description: string;
  amount: number;
  currency: string;
  revenue_date: string;
  payment_method?: string;
  platform_fee: number;
  taxes: number;
  net_amount?: number;
  collected_by?: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at: string;
}

// Composite interfaces for API responses
export interface TourWithDetails extends Tour {
  stops: TourStop[];
  participants: TourParticipant[];
  collaborations: TourCollaboration[];
  logistics: TourLogistics[];
  expenses: TourExpense[];
  revenue: TourRevenue[];
  statistics: TourStatistics;
}

export interface TourStatistics {
  total_stops: number;
  total_capacity: number;
  tickets_sold: number;
  occupancy_rate: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
}

// Form interfaces for creating/editing
export interface CreateTourRequest {
  name: string;
  description?: string;
  tour_type?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  estimated_revenue?: number;
  currency?: string;
  marketing_budget?: number;
  social_hashtag?: string;
  website_url?: string;
  booking_contact_email?: string;
  booking_contact_phone?: string;
  emergency_contact?: Record<string, any>;
  tour_requirements?: Record<string, any>;
  travel_policy?: Record<string, any>;
  cancellation_policy?: string;
  insurance_info?: Record<string, any>;
  is_public?: boolean;
  promotional_code?: string;
}

export interface UpdateTourRequest extends Partial<CreateTourRequest> {
  id: string;
  status?: TourStatus;
  actual_revenue?: number;
  tickets_sold?: number;
  gross_sales?: number;
}

export interface CreateTourStopRequest {
  tour_id: string;
  venue_name: string;
  venue_address?: string;
  venue_city: string;
  venue_state?: string;
  venue_country?: string;
  venue_contact?: Record<string, any>;
  venue_capacity?: number;
  event_date: string;
  doors_open?: string;
  show_time: string;
  show_duration_minutes?: number;
  soundcheck_time?: string;
  load_in_time?: string;
  load_out_time?: string;
  ticket_price?: number;
  vip_price?: number;
  tickets_available?: number;
  technical_requirements?: Record<string, any>;
  catering_requirements?: Record<string, any>;
  accommodation_info?: Record<string, any>;
  local_contacts?: Record<string, any>;
  parking_info?: string;
  accessibility_info?: string;
  covid_requirements?: string;
  order_index: number;
  travel_time_to_next?: number;
  distance_to_next_km?: number;
  notes?: string;
  weather_backup_plan?: string;
}

export interface CreateTourParticipantRequest {
  tour_id: string;
  user_id?: string;
  participant_name: string;
  role: ParticipantRole;
  join_date?: string;
  leave_date?: string;
  specific_shows?: string[];
  payment_rate?: number;
  payment_type?: PaymentType;
  payment_terms?: string;
  travel_covered?: boolean;
  accommodation_covered?: boolean;
  meals_covered?: boolean;
  meal_allowance?: number;
  equipment_provided?: boolean;
  special_requirements?: Record<string, any>;
  emergency_contact?: Record<string, any>;
  bio?: string;
  photo_url?: string;
  social_media?: Record<string, any>;
  performance_notes?: string;
  is_headliner?: boolean;
  performance_order?: number;
  stage_time_minutes?: number;
}

export interface CreateTourCollaborationRequest {
  tour_id: string;
  collaborator_id: string;
  role: CollaborationRole;
  responsibilities?: string[];
  revenue_share?: number;
  expense_share?: number;
  specific_shows?: string[];
  marketing_contribution?: Record<string, any>;
  venue_connections?: Record<string, any>;
  local_knowledge?: string;
  contact_priority?: number;
  decision_making_power?: boolean;
  financial_responsibility?: number;
  contract_terms?: Record<string, any>;
  invitation_expires_at?: string;
}

export interface CreateTourLogisticsRequest {
  tour_id: string;
  tour_stop_id?: string;
  type: LogisticsType;
  provider_name?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  booking_reference?: string;
  confirmation_number?: string;
  cost?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  participants?: string[];
  details?: Record<string, any>;
  requirements?: Record<string, any>;
  payment_due_date?: string;
  cancellation_policy?: string;
  modification_policy?: string;
  notes?: string;
}

export interface CreateTourExpenseRequest {
  tour_id: string;
  tour_stop_id?: string;
  logistics_id?: string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  expense_date: string;
  reimbursable?: boolean;
  receipt_url?: string;
  vendor_name?: string;
  vendor_contact?: string;
  payment_method?: string;
  tax_deductible?: boolean;
  notes?: string;
}

export interface CreateTourRevenueRequest {
  tour_id: string;
  tour_stop_id?: string;
  revenue_type: string;
  description: string;
  amount: number;
  currency?: string;
  revenue_date: string;
  payment_method?: string;
  platform_fee?: number;
  taxes?: number;
  net_amount?: number;
  notes?: string;
}

// Filter and search interfaces
export interface TourFilters {
  status?: TourStatus[];
  tour_type?: string[];
  start_date_from?: string;
  start_date_to?: string;
  manager_id?: string;
  agency_id?: string;
  is_public?: boolean;
  has_available_spots?: boolean;
  city?: string;
  state?: string;
  country?: string;
}

export interface TourSearchParams {
  query?: string;
  filters?: TourFilters;
  sort_by?: 'created_at' | 'start_date' | 'name' | 'revenue' | 'tickets_sold';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// API Response types
export interface TourListResponse {
  tours: Tour[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface TourDetailsResponse {
  tour_data: Tour;
  stops_data: TourStop[];
  participants_data: TourParticipant[];
  collaborations_data: TourCollaboration[];
  logistics_data: TourLogistics[];
  statistics: TourStatistics;
}

// Utility types
export interface TourParticipantWithUser extends TourParticipant {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface TourCollaborationWithUser extends TourCollaboration {
  collaborator?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    company_name?: string;
  };
}

export interface TourStopWithDetails extends TourStop {
  participants: TourParticipantWithUser[];
  logistics: TourLogistics[];
  expenses: TourExpense[];
  revenue: TourRevenue[];
}

// Dashboard and analytics types
export interface TourDashboardStats {
  total_tours: number;
  active_tours: number;
  upcoming_shows: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  average_occupancy: number;
  tours_by_status: Record<TourStatus, number>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  top_performing_cities: Array<{
    city: string;
    shows: number;
    revenue: number;
    occupancy: number;
  }>;
}

export interface TourCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'show' | 'travel' | 'soundcheck' | 'meeting' | 'other';
  tour_id: string;
  tour_stop_id?: string;
  venue_name?: string;
  venue_city?: string;
  status: TourStopStatus;
  description?: string;
  color?: string;
}

// Notification and communication types
export interface TourNotification {
  id: string;
  tour_id: string;
  recipient_id: string;
  type: 'collaboration_invite' | 'schedule_change' | 'payment_due' | 'reminder' | 'update';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface TourCommunication {
  id: string;
  tour_id: string;
  sender_id: string;
  recipients: string[];
  subject: string;
  message: string;
  attachments?: string[];
  is_announcement: boolean;
  created_at: string;
}