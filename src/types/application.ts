/**
 * Application related types and interfaces
 */

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'available';

export type SpotType = 'MC' | 'Feature' | 'Headliner' | 'Guest';

export interface ApplicationFormData {
  event_id: string;
  message: string;
  spot_type: SpotType;
  availability_confirmed: boolean;
  requirements_acknowledged: boolean;
}

export interface ApplicationData {
  id: string;
  comedian_id: string;
  comedian_name: string;
  comedian_avatar?: string;
  comedian_experience?: string;
  comedian_rating?: number;
  event_id: string;
  event_title: string;
  event_venue: string;
  event_date: string;
  applied_at: string;
  status: ApplicationStatus;
  message?: string;
  spot_type?: SpotType;
  availability_confirmed?: boolean;
  requirements_acknowledged?: boolean;
  is_shortlisted?: boolean;
  shortlisted_at?: string;
  /** True if this entry comes from directory_availability (avails form) rather than applications table */
  is_directory_avail?: boolean;
}

export interface ApplicationInsert {
  event_id: string;
  comedian_id: string;
  status?: ApplicationStatus;
  message?: string;
  spot_type?: SpotType;
  availability_confirmed?: boolean;
  requirements_acknowledged?: boolean;
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  message?: string;
  spot_type?: SpotType;
  availability_confirmed?: boolean;
  requirements_acknowledged?: boolean;
  responded_at?: string;
}

export interface ApplicationStats {
  mc: number;
  feature: number;
  headline: number;
  spot: number;
  pending: number;
  accepted: number;
  rejected: number;
  unread: number;
  total: number;
}

export interface ApplicationFilters {
  searchTerm?: string;
  eventFilter?: string;
  spotTypeFilter?: SpotType;
  statusFilter?: ApplicationStatus;
  sortBy?: 'applied_at_desc' | 'applied_at_asc' | 'comedian_name' | 'event_date' | 'most_experienced';
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}