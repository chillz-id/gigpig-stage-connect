// TypeScript types for the flight tracking system

export type FlightStatus = 'scheduled' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived' | 'diverted';
export type UpdateSource = 'api' | 'manual' | 'airline' | 'n8n_webhook';
export type NotificationPreference = 'all' | 'delays_only' | 'cancellations_only' | 'none';

// Main flight booking interface
export interface FlightBooking {
  id: string;
  tour_id?: string;
  event_id?: string;
  passenger_id: string;
  flight_number: string;
  airline: string;
  airline_iata_code?: string;
  departure_airport: string; // IATA code
  departure_airport_name?: string;
  arrival_airport: string; // IATA code
  arrival_airport_name?: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure?: string;
  actual_arrival?: string;
  estimated_departure?: string;
  estimated_arrival?: string;
  status: FlightStatus;
  gate?: string;
  terminal?: string;
  seat?: string;
  booking_reference?: string;
  confirmation_code?: string;
  ticket_class?: string;
  baggage_allowance: Record<string, any>;
  monitoring_enabled: boolean;
  notification_preferences: NotificationPreference;
  last_status_check: string;
  api_data: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Populated relations
  passenger?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  tour?: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    title: string;
    event_date: string;
  };
  status_updates?: FlightStatusUpdate[];
  notifications?: FlightNotification[];
}

// Flight status update interface
export interface FlightStatusUpdate {
  id: string;
  flight_booking_id: string;
  previous_status?: FlightStatus;
  new_status: FlightStatus;
  update_type?: string; // 'delay', 'gate_change', 'cancellation', etc.
  old_value?: string;
  new_value?: string;
  delay_minutes?: number;
  reason?: string;
  update_source: UpdateSource;
  api_response?: Record<string, any>;
  created_at: string;
}

// Flight notification interface
export interface FlightNotification {
  id: string;
  flight_booking_id: string;
  user_id: string;
  notification_type: string; // 'delay', 'cancellation', 'gate_change', etc.
  title: string;
  message: string;
  sent_via: string[]; // ['email', 'sms', 'push', 'slack']
  sent_at: string;
  read_at?: string;
  action_taken?: string; // 'acknowledged', 'rebooked', etc.
  metadata: Record<string, any>;

  // Populated relations
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Flight API configuration interface
export interface FlightApiConfig {
  id: string;
  provider: string; // 'flightaware', 'amadeus', etc.
  api_key_hash?: string;
  endpoint_url: string;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  current_minute_requests: number;
  current_hour_requests: number;
  last_request_minute?: string;
  last_request_hour?: string;
  is_active: boolean;
  priority: number;
  success_rate: number;
  average_response_time_ms: number;
  last_successful_call?: string;
  last_failed_call?: string;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

// N8N workflow log interface
export interface N8NFlightWorkflowLog {
  id: string;
  workflow_id: string;
  execution_id?: string;
  flight_booking_id?: string;
  workflow_type: string; // 'monitor', 'alert', 'rebooking', 'status_check'
  status: string; // 'running', 'success', 'error', 'cancelled'
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message?: string;
  execution_time_ms?: number;
  started_at: string;
  completed_at?: string;
  webhook_url?: string;
  retry_count: number;
  max_retries: number;
}

// Flight search cache interface
export interface FlightSearchCache {
  id: string;
  route_key: string; // Composite key like "JFK-LAX-2025-01-15"
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  search_results: FlightSearchResult[];
  cached_at: string;
  expires_at: string;
  hit_count: number;
  last_accessed: string;
}

// Flight search result interface
export interface FlightSearchResult {
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: string;
  currency: string;
  stops: number;
  booking_class: string;
  available_seats?: number;
  aircraft_type?: string;
  meal_service?: boolean;
  wifi_available?: boolean;
}

// Form interfaces for creating/updating flight bookings
export interface CreateFlightBookingFormData {
  tour_id?: string;
  event_id?: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  gate?: string;
  terminal?: string;
  seat?: string;
  booking_reference?: string;
  confirmation_code?: string;
  ticket_class?: string;
  baggage_allowance?: Record<string, any>;
  monitoring_enabled?: boolean;
  notification_preferences?: NotificationPreference;
}

export interface UpdateFlightBookingFormData extends Partial<CreateFlightBookingFormData> {
  status?: FlightStatus;
  actual_departure?: string;
  actual_arrival?: string;
  estimated_departure?: string;
  estimated_arrival?: string;
  api_data?: Record<string, any>;
}

// Flight search interface
export interface FlightSearchParams {
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  return_date?: string;
  passengers?: number;
  ticket_class?: string;
  max_results?: number;
  max_price?: number;
  preferred_airlines?: string[];
  max_stops?: number;
}

// Real-time flight data interface
export interface RealTimeFlightData {
  flight_number: string;
  airline: string;
  status: FlightStatus;
  scheduled_departure: string;
  scheduled_arrival: string;
  estimated_departure?: string;
  estimated_arrival?: string;
  actual_departure?: string;
  actual_arrival?: string;
  gate?: string;
  terminal?: string;
  delay_minutes?: number;
  cancellation_reason?: string;
  diverted_airport?: string;
  aircraft_type?: string;
  registration?: string;
  last_updated: string;
}

// Alternative flight options interface
export interface AlternativeFlightOption {
  original_flight: FlightBooking;
  alternatives: FlightSearchResult[];
  search_timestamp: string;
  reason: string; // 'cancellation', 'significant_delay', 'user_request'
  auto_generated: boolean;
}

// Flight notification settings interface
export interface FlightNotificationSettings {
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  slack_notifications: boolean;
  notification_preferences: NotificationPreference;
  delay_threshold_minutes: number; // Notify only if delay is >= this
  advance_notification_hours: number; // Notify X hours before departure
  quiet_hours: {
    start: string; // HH:mm format
    end: string; // HH:mm format
    enabled: boolean;
  };
}

// Filter and search interfaces
export interface FlightFilters {
  status?: FlightStatus[];
  departure_airport?: string[];
  arrival_airport?: string[];
  airline?: string[];
  passenger_id?: string[];
  tour_id?: string[];
  event_id?: string[];
  departure_date_range?: {
    start?: string;
    end?: string;
  };
  monitoring_enabled?: boolean;
  has_delays?: boolean;
  search?: string;
}

export interface FlightSort {
  field: 'scheduled_departure' | 'created_at' | 'updated_at' | 'airline' | 'status';
  direction: 'asc' | 'desc';
}

// Dashboard and analytics interfaces
export interface FlightStatistics {
  total_flights: number;
  active_flights: number; // scheduled, delayed, boarding
  completed_flights: number; // departed, arrived
  cancelled_flights: number;
  delayed_flights: number;
  on_time_flights: number;
  flights_by_status: Record<FlightStatus, number>;
  flights_by_airline: Record<string, number>;
  average_delay_minutes: number;
  punctuality_rate: number; // percentage of on-time flights
}

export interface UserFlightStatistics extends FlightStatistics {
  upcoming_flights: number;
  flights_today: number;
  flights_this_week: number;
  miles_traveled: number;
  countries_visited: number;
  favorite_airline: string;
  most_visited_airport: string;
}

// API response interfaces
export interface FlightBookingsResponse {
  flights: FlightBooking[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface FlightSearchResponse {
  results: FlightSearchResult[];
  search_params: FlightSearchParams;
  cached: boolean;
  cache_expires_at?: string;
  api_provider: string;
  search_time_ms: number;
}

// Hook return types
export interface UseFlightBookingsReturn {
  flights: FlightBooking[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  hasMore: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

export interface UseFlightBookingReturn {
  flight: FlightBooking | null;
  isLoading: boolean;
  error: Error | null;
  updateFlight: (updates: UpdateFlightBookingFormData) => Promise<void>;
  deleteFlight: () => Promise<void>;
  enableMonitoring: () => Promise<void>;
  disableMonitoring: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  findAlternatives: () => Promise<AlternativeFlightOption>;
}

export interface UseFlightSearchReturn {
  search: (params: FlightSearchParams) => Promise<FlightSearchResponse>;
  results: FlightSearchResult[];
  isSearching: boolean;
  error: Error | null;
  lastSearch: FlightSearchParams | null;
}

// Integration interfaces for other systems
export interface FlightTaskIntegration {
  flight_booking_id: string;
  task_template_id: string;
  generated_tasks: string[]; // task IDs
  trigger_event: 'booking_created' | 'flight_delayed' | 'flight_cancelled' | 'departure_soon';
  auto_generated: boolean;
}

export interface FlightTourIntegration {
  tour_id: string;
  tour_name: string;
  flights: FlightBooking[];
  route_optimization: {
    suggested_order: string[]; // airport codes
    total_distance: number;
    total_duration_hours: number;
    estimated_cost: number;
  };
}

// WebSocket event interfaces
export interface FlightStatusEvent {
  type: 'flight_status_update';
  flight_id: string;
  previous_status: FlightStatus;
  new_status: FlightStatus;
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  timestamp: string;
}

export interface FlightNotificationEvent {
  type: 'flight_notification';
  notification: FlightNotification;
  timestamp: string;
}

// Airport and airline data interfaces
export interface Airport {
  iata_code: string;
  icao_code?: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Airline {
  iata_code: string;
  icao_code?: string;
  name: string;
  country: string;
  logo_url?: string;
  website?: string;
}

// Export collections
export type FlightManagementTypes = {
  FlightBooking: FlightBooking;
  FlightStatusUpdate: FlightStatusUpdate;
  FlightNotification: FlightNotification;
  FlightSearchResult: FlightSearchResult;
  CreateFlightBookingFormData: CreateFlightBookingFormData;
  UpdateFlightBookingFormData: UpdateFlightBookingFormData;
  FlightSearchParams: FlightSearchParams;
  FlightFilters: FlightFilters;
  FlightStatistics: FlightStatistics;
  RealTimeFlightData: RealTimeFlightData;
  AlternativeFlightOption: AlternativeFlightOption;
  FlightNotificationSettings: FlightNotificationSettings;
};