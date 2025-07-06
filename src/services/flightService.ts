// Flight Management Service - API layer for flight tracking and management
import { supabase } from '@/lib/supabase';
import type {
  FlightBooking,
  FlightStatusUpdate,
  FlightNotification,
  CreateFlightBookingFormData,
  UpdateFlightBookingFormData,
  FlightSearchParams,
  FlightSearchResponse,
  FlightSearchResult,
  FlightFilters,
  FlightSort,
  FlightBookingsResponse,
  FlightStatistics,
  UserFlightStatistics,
  RealTimeFlightData,
  AlternativeFlightOption,
  FlightNotificationSettings,
  Airport,
  Airline
} from '@/types/flight';

// ============================================================================
// FLIGHT BOOKING CRUD OPERATIONS
// ============================================================================

export const flightService = {
  // Get flight bookings with filtering, sorting, and pagination
  async getFlightBookings(
    filters: FlightFilters = {},
    sort: FlightSort = { field: 'scheduled_departure', direction: 'asc' },
    page: number = 1,
    pageSize: number = 20
  ): Promise<FlightBookingsResponse> {
    let query = supabase
      .from('flight_bookings')
      .select(`
        *,
        passenger:passenger_id(id, name, email, avatar_url),
        tour:tour_id(id, name),
        event:event_id(id, title, event_date),
        status_updates:flight_status_updates(id, update_type, created_at),
        notifications:flight_notifications(id, notification_type, read_at)
      `, { count: 'exact' });

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.departure_airport?.length) {
      query = query.in('departure_airport', filters.departure_airport);
    }
    if (filters.arrival_airport?.length) {
      query = query.in('arrival_airport', filters.arrival_airport);
    }
    if (filters.airline?.length) {
      query = query.in('airline', filters.airline);
    }
    if (filters.passenger_id?.length) {
      query = query.in('passenger_id', filters.passenger_id);
    }
    if (filters.tour_id?.length) {
      query = query.in('tour_id', filters.tour_id);
    }
    if (filters.event_id?.length) {
      query = query.in('event_id', filters.event_id);
    }
    if (filters.departure_date_range?.start) {
      query = query.gte('scheduled_departure', filters.departure_date_range.start);
    }
    if (filters.departure_date_range?.end) {
      query = query.lte('scheduled_departure', filters.departure_date_range.end);
    }
    if (filters.monitoring_enabled !== undefined) {
      query = query.eq('monitoring_enabled', filters.monitoring_enabled);
    }
    if (filters.has_delays) {
      query = query.in('status', ['delayed']);
    }
    if (filters.search) {
      query = query.or(`flight_number.ilike.%${filters.search}%,airline.ilike.%${filters.search}%,departure_airport.ilike.%${filters.search}%,arrival_airport.ilike.%${filters.search}%`);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      flights: data || [],
      total_count: count || 0,
      page,
      page_size: pageSize,
      has_more: (count || 0) > end + 1
    };
  },

  // Get single flight booking with full details
  async getFlightBooking(id: string): Promise<FlightBooking> {
    const { data, error } = await supabase
      .from('flight_bookings')
      .select(`
        *,
        passenger:passenger_id(id, name, email, avatar_url),
        tour:tour_id(id, name),
        event:event_id(id, title, event_date),
        status_updates:flight_status_updates(*),
        notifications:flight_notifications(*, user:user_id(id, name, email))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Flight booking not found');

    return data;
  },

  // Create new flight booking
  async createFlightBooking(flightData: CreateFlightBookingFormData): Promise<FlightBooking> {
    const { data, error } = await supabase
      .from('flight_bookings')
      .insert([{
        ...flightData,
        passenger_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select(`
        *,
        passenger:passenger_id(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update flight booking
  async updateFlightBooking(id: string, updates: UpdateFlightBookingFormData): Promise<FlightBooking> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('flight_bookings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        passenger:passenger_id(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Delete flight booking
  async deleteFlightBooking(id: string): Promise<void> {
    const { error } = await supabase
      .from('flight_bookings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get user's flight bookings
  async getUserFlightBookings(
    userId: string,
    filters: Omit<FlightFilters, 'passenger_id'> = {}
  ): Promise<FlightBooking[]> {
    const { data, error } = await supabase
      .from('flight_bookings')
      .select(`
        *,
        tour:tour_id(id, name),
        event:event_id(id, title, event_date),
        status_updates:flight_status_updates(id, update_type, created_at, delay_minutes)
      `)
      .eq('passenger_id', userId)
      .order('scheduled_departure', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Enable/disable flight monitoring
  async toggleFlightMonitoring(id: string, enabled: boolean): Promise<FlightBooking> {
    return this.updateFlightBooking(id, { monitoring_enabled: enabled });
  }
};

// ============================================================================
// FLIGHT SEARCH OPERATIONS
// ============================================================================

export const flightSearchService = {
  // Search for flights
  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
    const routeKey = `${params.departure_airport}-${params.arrival_airport}-${params.departure_date}`;
    
    // Check cache first
    const { data: cachedResults } = await supabase
      .from('flight_search_cache')
      .select('*')
      .eq('route_key', routeKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedResults) {
      // Update hit count and last accessed
      await supabase
        .from('flight_search_cache')
        .update({ 
          hit_count: cachedResults.hit_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', cachedResults.id);

      return {
        results: cachedResults.search_results,
        search_params: params,
        cached: true,
        cache_expires_at: cachedResults.expires_at,
        api_provider: 'cache',
        search_time_ms: 0
      };
    }

    // Make API call to flight search service
    const startTime = Date.now();
    try {
      // This would typically call a flight search API like Amadeus, Skyscanner, etc.
      // For now, we'll return mock data
      const mockResults: FlightSearchResult[] = [
        {
          airline: 'Jetstar',
          flight_number: 'JQ501',
          departure_time: `${params.departure_date}T08:00:00Z`,
          arrival_time: `${params.departure_date}T10:30:00Z`,
          duration: '2h 30m',
          price: '299.00',
          currency: 'AUD',
          stops: 0,
          booking_class: 'Economy',
          available_seats: 15,
          aircraft_type: 'A320',
          meal_service: false,
          wifi_available: true
        },
        {
          airline: 'Virgin Australia',
          flight_number: 'VA924',
          departure_time: `${params.departure_date}T09:15:00Z`,
          arrival_time: `${params.departure_date}T11:45:00Z`,
          duration: '2h 30m',
          price: '349.00',
          currency: 'AUD',
          stops: 0,
          booking_class: 'Economy',
          available_seats: 8,
          aircraft_type: 'B737',
          meal_service: true,
          wifi_available: true
        }
      ];

      const searchTime = Date.now() - startTime;

      // Cache the results
      await supabase
        .from('flight_search_cache')
        .insert({
          route_key: routeKey,
          departure_airport: params.departure_airport,
          arrival_airport: params.arrival_airport,
          departure_date: params.departure_date,
          search_results: mockResults,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
        });

      return {
        results: mockResults,
        search_params: params,
        cached: false,
        api_provider: 'mock',
        search_time_ms: searchTime
      };
    } catch (error) {
      throw new Error(`Flight search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Find alternative flights for cancelled/delayed flights
  async findAlternativeFlights(originalFlightId: string): Promise<AlternativeFlightOption> {
    const originalFlight = await flightService.getFlightBooking(originalFlightId);
    
    const searchParams: FlightSearchParams = {
      departure_airport: originalFlight.departure_airport,
      arrival_airport: originalFlight.arrival_airport,
      departure_date: originalFlight.scheduled_departure.split('T')[0],
      passengers: 1,
      max_results: 10
    };

    const searchResponse = await this.searchFlights(searchParams);

    // Filter out flights that are too different from the original
    const alternatives = searchResponse.results.filter(flight => {
      const departureTime = new Date(flight.departure_time);
      const originalTime = new Date(originalFlight.scheduled_departure);
      const timeDiff = Math.abs(departureTime.getTime() - originalTime.getTime()) / (1000 * 60 * 60); // hours
      
      return timeDiff <= 12; // Within 12 hours of original
    });

    return {
      original_flight: originalFlight,
      alternatives,
      search_timestamp: new Date().toISOString(),
      reason: originalFlight.status === 'cancelled' ? 'cancellation' : 'significant_delay',
      auto_generated: true
    };
  }
};

// ============================================================================
// REAL-TIME FLIGHT TRACKING
// ============================================================================

export const flightTrackingService = {
  // Get real-time flight data
  async getRealTimeFlightData(flightNumber: string, date: string): Promise<RealTimeFlightData> {
    // This would typically call FlightAware, Amadeus, or similar API
    // For now, we'll return mock data
    const mockData: RealTimeFlightData = {
      flight_number: flightNumber,
      airline: 'Jetstar',
      status: 'scheduled',
      scheduled_departure: `${date}T08:00:00Z`,
      scheduled_arrival: `${date}T10:30:00Z`,
      gate: 'B12',
      terminal: '2',
      aircraft_type: 'A320',
      registration: 'VH-ABC',
      last_updated: new Date().toISOString()
    };

    return mockData;
  },

  // Trigger N8N workflow for flight monitoring
  async triggerFlightMonitoring(flightId: string): Promise<void> {
    const flight = await flightService.getFlightBooking(flightId);
    
    // Call N8N webhook
    const webhookUrl = 'http://localhost:5678/webhook/flight-status-webhook';
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flight_number: flight.flight_number,
          airline: flight.airline,
          departure_date: flight.scheduled_departure.split('T')[0],
          booking_id: flight.id
        })
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to trigger flight monitoring:', error);
      throw error;
    }
  },

  // Update flight status from real-time data
  async updateFlightStatus(
    flightId: string,
    realTimeData: Partial<RealTimeFlightData>
  ): Promise<FlightBooking> {
    const updates: UpdateFlightBookingFormData = {
      status: realTimeData.status,
      estimated_departure: realTimeData.estimated_departure,
      estimated_arrival: realTimeData.estimated_arrival,
      actual_departure: realTimeData.actual_departure,
      actual_arrival: realTimeData.actual_arrival,
      gate: realTimeData.gate,
      api_data: realTimeData
    };

    return flightService.updateFlightBooking(flightId, updates);
  }
};

// ============================================================================
// FLIGHT NOTIFICATIONS
// ============================================================================

export const flightNotificationService = {
  // Get user's flight notifications
  async getUserNotifications(userId: string): Promise<FlightNotification[]> {
    const { data, error } = await supabase
      .from('flight_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('flight_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Get user's notification settings
  async getNotificationSettings(userId: string): Promise<FlightNotificationSettings> {
    // This would typically be stored in a user_settings table
    // For now, return default settings
    return {
      user_id: userId,
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      slack_notifications: false,
      notification_preferences: 'all',
      delay_threshold_minutes: 15,
      advance_notification_hours: 2,
      quiet_hours: {
        start: '22:00',
        end: '06:00',
        enabled: true
      }
    };
  },

  // Update user's notification settings
  async updateNotificationSettings(
    userId: string,
    settings: Partial<FlightNotificationSettings>
  ): Promise<FlightNotificationSettings> {
    // This would typically update a user_settings table
    // For now, just return the updated settings
    const currentSettings = await this.getNotificationSettings(userId);
    return { ...currentSettings, ...settings };
  }
};

// ============================================================================
// FLIGHT ANALYTICS
// ============================================================================

export const flightAnalyticsService = {
  // Get user flight statistics
  async getUserFlightStatistics(userId: string): Promise<UserFlightStatistics> {
    const { data, error } = await supabase
      .rpc('get_user_flight_statistics', { user_id: userId });

    if (error) {
      // Fallback to basic statistics if RPC doesn't exist
      const flights = await flightService.getUserFlightBookings(userId);
      
      const stats: UserFlightStatistics = {
        total_flights: flights.length,
        active_flights: flights.filter(f => ['scheduled', 'delayed', 'boarding'].includes(f.status)).length,
        completed_flights: flights.filter(f => ['departed', 'arrived'].includes(f.status)).length,
        cancelled_flights: flights.filter(f => f.status === 'cancelled').length,
        delayed_flights: flights.filter(f => f.status === 'delayed').length,
        on_time_flights: flights.filter(f => f.status === 'arrived' && !f.estimated_departure).length,
        flights_by_status: flights.reduce((acc, flight) => {
          acc[flight.status] = (acc[flight.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        flights_by_airline: flights.reduce((acc, flight) => {
          acc[flight.airline] = (acc[flight.airline] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        average_delay_minutes: 0, // Calculate from status updates
        punctuality_rate: 85, // Mock value
        upcoming_flights: flights.filter(f => new Date(f.scheduled_departure) > new Date()).length,
        flights_today: flights.filter(f => {
          const today = new Date().toISOString().split('T')[0];
          return f.scheduled_departure.startsWith(today);
        }).length,
        flights_this_week: flights.filter(f => {
          const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          return new Date(f.scheduled_departure) <= weekFromNow;
        }).length,
        miles_traveled: 0, // Calculate from route distances
        countries_visited: new Set(flights.map(f => f.arrival_airport.substring(0, 2))).size,
        favorite_airline: Object.entries(flights.reduce((acc, flight) => {
          acc[flight.airline] = (acc[flight.airline] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0]?.[0] || '',
        most_visited_airport: Object.entries(flights.reduce((acc, flight) => {
          acc[flight.arrival_airport] = (acc[flight.arrival_airport] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0]?.[0] || ''
      };

      return stats;
    }

    return data;
  },

  // Get flight delay trends
  async getFlightDelayTrends(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<Array<{ date: string; average_delay: number; flights_count: number }>> {
    const { data, error } = await supabase
      .rpc('get_flight_delay_trends', {
        start_date: startDate,
        end_date: endDate,
        user_id: userId
      });

    if (error) {
      // Return mock data if RPC doesn't exist
      return [
        { date: '2025-01-01', average_delay: 15, flights_count: 5 },
        { date: '2025-01-02', average_delay: 8, flights_count: 3 },
        { date: '2025-01-03', average_delay: 22, flights_count: 7 }
      ];
    }

    return data || [];
  }
};

// ============================================================================
// AIRPORT AND AIRLINE DATA
// ============================================================================

export const airportService = {
  // Search airports
  async searchAirports(query: string): Promise<Airport[]> {
    // This would typically call an airports API
    // For now, return mock data
    const mockAirports: Airport[] = [
      {
        iata_code: 'SYD',
        icao_code: 'YSSY',
        name: 'Sydney Kingsford Smith Airport',
        city: 'Sydney',
        country: 'Australia',
        timezone: 'Australia/Sydney',
        coordinates: { latitude: -33.9399, longitude: 151.1753 }
      },
      {
        iata_code: 'MEL',
        icao_code: 'YMML',
        name: 'Melbourne Airport',
        city: 'Melbourne',
        country: 'Australia',
        timezone: 'Australia/Melbourne',
        coordinates: { latitude: -37.6690, longitude: 144.8410 }
      }
    ];

    return mockAirports.filter(airport => 
      airport.name.toLowerCase().includes(query.toLowerCase()) ||
      airport.city.toLowerCase().includes(query.toLowerCase()) ||
      airport.iata_code.toLowerCase().includes(query.toLowerCase())
    );
  },

  // Get airport by IATA code
  async getAirport(iataCode: string): Promise<Airport | null> {
    const airports = await this.searchAirports(iataCode);
    return airports.find(airport => airport.iata_code === iataCode) || null;
  }
};

export const airlineService = {
  // Search airlines
  async searchAirlines(query: string): Promise<Airline[]> {
    const mockAirlines: Airline[] = [
      {
        iata_code: 'JQ',
        icao_code: 'JST',
        name: 'Jetstar Airways',
        country: 'Australia',
        website: 'https://www.jetstar.com'
      },
      {
        iata_code: 'VA',
        icao_code: 'VOZ',
        name: 'Virgin Australia',
        country: 'Australia',
        website: 'https://www.virginaustralia.com'
      }
    ];

    return mockAirlines.filter(airline =>
      airline.name.toLowerCase().includes(query.toLowerCase()) ||
      airline.iata_code.toLowerCase().includes(query.toLowerCase())
    );
  }
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export const flightSubscriptionService = {
  // Subscribe to flight status changes
  subscribeToFlightChanges(
    callback: (payload: any) => void,
    filters?: { flight_id?: string; user_id?: string }
  ) {
    let channel = supabase
      .channel('flight-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'flight_bookings',
          ...(filters?.flight_id && { filter: `id=eq.${filters.flight_id}` })
        }, 
        callback
      );

    if (filters?.user_id) {
      channel = channel.on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_bookings',
          filter: `passenger_id=eq.${filters.user_id}`
        },
        callback
      );
    }

    return channel.subscribe();
  },

  // Subscribe to flight notifications
  subscribeToFlightNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`flight-notifications-${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flight_notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
};

export default flightService;