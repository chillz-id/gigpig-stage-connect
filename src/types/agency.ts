// TypeScript interfaces for Agency Management System

export type AgencyType = 'talent_agency' | 'booking_agency' | 'management_company' | 'hybrid';
export type AgencyStatus = 'active' | 'suspended' | 'pending_verification' | 'inactive';
export type ManagerRole = 'primary_manager' | 'co_manager' | 'assistant_manager' | 'agency_owner';
export type ArtistRelationshipStatus = 'active' | 'inactive' | 'pending' | 'terminated';
export type DealStatus = 'draft' | 'proposed' | 'negotiating' | 'counter_offered' | 'accepted' | 'declined' | 'expired';
export type DealType = 'booking' | 'management' | 'representation' | 'endorsement' | 'collaboration';
export type NegotiationStage = 'initial' | 'terms_discussion' | 'financial_negotiation' | 'final_review' | 'contract_preparation';

// Core Agency Interface
export interface Agency {
  id: string;
  name: string;
  legal_name?: string;
  agency_type: AgencyType;
  status: AgencyStatus;
  owner_id: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  website_url?: string;
  
  // Address Information
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  
  // Business Information
  abn?: string;
  business_license?: string;
  insurance_details?: Record<string, any>;
  
  // Agency Profile
  description?: string;
  specialties?: string[];
  logo_url?: string;
  banner_url?: string;
  
  // Financial Information
  commission_rate?: number;
  payment_terms?: string;
  billing_address?: string;
  
  // Settings
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  verified_at?: string;
}

// Manager Profile Interface
export interface ManagerProfile {
  id: string;
  user_id: string;
  agency_id: string;
  
  // Profile Information
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  
  // Role & Permissions
  role: ManagerRole;
  permissions?: Record<string, any>;
  
  // Professional Information
  title?: string;
  bio?: string;
  experience_years?: number;
  specializations?: string[];
  languages?: string[];
  
  // Contact Preferences
  preferred_contact_method?: string;
  availability_hours?: Record<string, any>;
  timezone?: string;
  
  // Performance Metrics
  total_artists?: number;
  active_deals?: number;
  deals_closed?: number;
  total_revenue?: number;
  
  // Social Links
  linkedin_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  
  // Settings
  notification_preferences?: Record<string, any>;
  dashboard_settings?: Record<string, any>;
  
  // Status
  is_active?: boolean;
  is_verified?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// Artist Management Interface
export interface ArtistManagement {
  id: string;
  artist_id: string;
  agency_id: string;
  manager_id?: string;
  
  // Relationship Details
  relationship_status: ArtistRelationshipStatus;
  relationship_type: string;
  
  // Contract Information
  contract_start_date?: string;
  contract_end_date?: string;
  commission_rate?: number;
  minimum_booking_fee?: number;
  
  // Terms & Conditions
  exclusive_territories?: string[];
  excluded_venues?: string[];
  special_terms?: string;
  
  // Performance Tracking
  bookings_count?: number;
  total_revenue?: number;
  commission_earned?: number;
  
  // Artist Preferences
  preferred_venues?: string[];
  preferred_event_types?: string[];
  availability_notes?: string;
  
  // Notes & Communication
  notes?: string;
  tags?: string[];
  
  // Status Tracking
  is_active?: boolean;
  priority_level?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_contact_at?: string;
  
  // Related data (populated via joins)
  artist?: {
    id: string;
    stage_name?: string;
    name?: string;
    avatar_url?: string;
    location?: string;
    bio?: string;
  };
  manager?: ManagerProfile;
}

// Deal Negotiation Interface
export interface DealNegotiation {
  id: string;
  
  // Core Deal Information
  deal_type: DealType;
  status: DealStatus;
  negotiation_stage: NegotiationStage;
  
  // Parties Involved
  agency_id: string;
  artist_id: string;
  promoter_id: string;
  manager_id?: string;
  event_id: string;
  
  // Deal Details
  title: string;
  description?: string;
  
  // Financial Terms
  proposed_fee?: number;
  minimum_fee?: number;
  maximum_fee?: number;
  currency?: string;
  commission_rate?: number;
  
  // Performance Details
  performance_date?: string;
  performance_duration?: number;
  technical_requirements?: string;
  
  // Negotiation History
  offers?: DealOffer[];
  counter_offers?: DealCounterOffer[];
  negotiation_notes?: string;
  
  // Terms & Conditions
  terms_and_conditions?: string;
  special_requirements?: string;
  cancellation_policy?: string;
  
  // Strategy & Automation
  negotiation_strategy?: NegotiationStrategy;
  automated_responses?: boolean;
  auto_accept_threshold?: number;
  auto_decline_threshold?: number;
  
  // Timeline
  deadline?: string;
  response_time_hours?: number;
  
  // Analytics
  view_count?: number;
  response_count?: number;
  revision_count?: number;
  
  // Priority & Classification
  priority_level?: number;
  tags?: string[];
  
  // External References
  external_deal_id?: string;
  contract_url?: string;
  
  // Status Tracking
  is_active?: boolean;
  is_template?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  expires_at?: string;
  accepted_at?: string;
  declined_at?: string;
  
  // Related data (populated via joins)
  artist?: {
    id: string;
    stage_name?: string;
    name?: string;
    avatar_url?: string;
  };
  promoter?: {
    id: string;
    name?: string;
    stage_name?: string;
  };
  event?: {
    id: string;
    title: string;
    event_date: string;
    venue: string;
  };
  agency?: Agency;
  manager?: ManagerProfile;
}

// Deal Offer Interface
export interface DealOffer {
  amount: number;
  currency?: string;
  terms?: Record<string, any>;
  offered_at: string;
  offered_by: string;
  notes?: string;
  is_automated?: boolean;
}

// Deal Counter Offer Interface
export interface DealCounterOffer extends DealOffer {
  response_to_offer_id?: string;
  counter_terms?: Record<string, any>;
}

// Negotiation Strategy Interface
export interface NegotiationStrategy {
  recommended_minimum?: number;
  recommended_target?: number;
  recommended_maximum?: number;
  negotiation_approach?: 'aggressive' | 'conservative' | 'balanced';
  artist_metrics?: {
    total_bookings: number;
    average_fee: number;
    highest_fee: number;
    experience_level: 'emerging' | 'intermediate' | 'experienced';
  };
  market_data?: {
    market_average: number;
    market_position: 'budget' | 'market_rate' | 'premium';
  };
  auto_response_thresholds?: {
    auto_accept_above: number;
    auto_decline_below: number;
    requires_review_between: [number, number];
  };
  calculated_at: string;
}

// Deal Message Interface
export interface DealMessage {
  id: string;
  deal_id: string;
  sender_id: string;
  
  // Message Content
  message_type: 'text' | 'offer' | 'counter_offer' | 'acceptance' | 'rejection';
  subject?: string;
  content: string;
  
  // Offer Details (if applicable)
  offer_amount?: number;
  offer_terms?: Record<string, any>;
  
  // Message Properties
  is_automated?: boolean;
  is_internal?: boolean;
  
  // Status
  is_read?: boolean;
  read_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related data
  sender?: {
    id: string;
    name?: string;
    stage_name?: string;
    avatar_url?: string;
  };
}

// Agency Analytics Interface
export interface AgencyAnalytics {
  id: string;
  agency_id: string;
  
  // Date Range
  period_start: string;
  period_end: string;
  
  // Key Metrics
  total_artists?: number;
  active_artists?: number;
  new_artists?: number;
  
  // Deal Metrics
  deals_initiated?: number;
  deals_closed?: number;
  deals_declined?: number;
  average_deal_value?: number;
  
  // Financial Metrics
  total_revenue?: number;
  commission_earned?: number;
  average_commission_rate?: number;
  
  // Performance Metrics
  average_response_time_hours?: number;
  client_satisfaction_score?: number;
  
  // Detailed Data
  metrics_data?: Record<string, any>;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Dashboard Data Interface
export interface AgencyDashboardData {
  agency_id: string;
  generated_at: string;
  recent_deals: Array<{
    id: string;
    title: string;
    artist_name?: string;
    proposed_fee?: number;
    status: DealStatus;
    created_at: string;
    deadline?: string;
  }>;
  artist_summary: {
    total_artists: number;
    active_artists: number;
    top_performers: Array<{
      artist_id: string;
      artist_name?: string;
      total_revenue: number;
      bookings_count: number;
    }>;
  };
  financial_summary: {
    total_revenue_30d: number;
    commission_earned_30d: number;
    deals_closed_30d: number;
    average_deal_value: number;
  };
  pending_actions: {
    pending_deals: number;
    expiring_soon: number;
    new_messages: number;
  };
}

// API Response Types
export interface CreateAgencyRequest {
  name: string;
  legal_name?: string;
  agency_type: AgencyType;
  email?: string;
  phone?: string;
  website_url?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  specialties?: string[];
  commission_rate?: number;
}

export interface CreateManagerProfileRequest {
  agency_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: ManagerRole;
  title?: string;
  bio?: string;
  specializations?: string[];
}

export interface CreateArtistManagementRequest {
  artist_id: string;
  agency_id: string;
  manager_id?: string;
  relationship_type: string;
  commission_rate?: number;
  minimum_booking_fee?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  notes?: string;
}

export interface CreateDealNegotiationRequest {
  deal_type: DealType;
  agency_id: string;
  artist_id: string;
  promoter_id: string;
  event_id: string;
  title: string;
  description?: string;
  proposed_fee?: number;
  minimum_fee?: number;
  maximum_fee?: number;
  performance_date?: string;
  performance_duration?: number;
  deadline?: string;
  automated_responses?: boolean;
}

export interface UpdateDealStatusRequest {
  status: DealStatus;
  negotiation_stage?: NegotiationStage;
  notes?: string;
}

export interface SendDealMessageRequest {
  deal_id: string;
  message_type: DealMessage['message_type'];
  content: string;
  subject?: string;
  offer_amount?: number;
  offer_terms?: Record<string, any>;
}

// Filter and Search Types
export interface AgencyFilters {
  status?: AgencyStatus[];
  agency_type?: AgencyType[];
  specialties?: string[];
  location?: string;
  search?: string;
}

export interface DealFilters {
  status?: DealStatus[];
  deal_type?: DealType[];
  artist_id?: string;
  agency_id?: string;
  promoter_id?: string;
  date_from?: string;
  date_to?: string;
  min_fee?: number;
  max_fee?: number;
  priority_level?: number[];
  search?: string;
}

export interface ArtistManagementFilters {
  relationship_status?: ArtistRelationshipStatus[];
  manager_id?: string;
  priority_level?: number[];
  search?: string;
}

// Error Types
export interface AgencyError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Export all types as a namespace for easier imports
export namespace Agency {
  export type Type = AgencyType;
  export type Status = AgencyStatus;
  export type ManagerRole = ManagerRole;
  export type ArtistRelationshipStatus = ArtistRelationshipStatus;
  export type DealStatus = DealStatus;
  export type DealType = DealType;
  export type NegotiationStage = NegotiationStage;
}