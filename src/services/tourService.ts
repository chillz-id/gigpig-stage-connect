// Tour Service - Complete service layer for tour management
import { supabase } from '@/lib/supabase';
import type {
  Tour,
  TourStop,
  TourParticipant,
  TourCollaboration,
  TourLogistics,
  TourExpense,
  TourRevenue,
  TourItinerary,
  TourWithDetails,
  TourStatistics,
  TourListResponse,
  TourDetailsResponse,
  TourSearchParams,
  TourFilters,
  TourDashboardStats,
  TourCalendarEvent,
  CreateTourRequest,
  UpdateTourRequest,
  CreateTourStopRequest,
  CreateTourParticipantRequest,
  CreateTourCollaborationRequest,
  CreateTourLogisticsRequest,
  CreateTourExpenseRequest,
  CreateTourRevenueRequest,
  TourParticipantWithUser,
  TourCollaborationWithUser,
  TourStopWithDetails
} from '@/types/tour';

class TourService {
  // =====================================
  // TOUR MANAGEMENT
  // =====================================

  async createTour(data: CreateTourRequest): Promise<Tour> {
    const { data: tour, error } = await supabase
      .from('tours')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return tour;
  }

  async updateTour(id: string, data: UpdateTourRequest): Promise<Tour> {
    const { data: tour, error } = await supabase
      .from('tours')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return tour;
  }

  async getTour(id: string): Promise<Tour | null> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getTourWithDetails(id: string): Promise<TourDetailsResponse | null> {
    const { data, error } = await supabase
      .rpc('get_tour_details', { _tour_id: id })
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getTours(params: TourSearchParams = {}): Promise<TourListResponse> {
    let query = supabase
      .from('tours')
      .select('*', { count: 'exact' });

    // Apply filters
    if (params.filters) {
      const filters = params.filters;
      
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      
      if (filters.tour_type?.length) {
        query = query.in('tour_type', filters.tour_type);
      }
      
      if (filters.start_date_from) {
        query = query.gte('start_date', filters.start_date_from);
      }
      
      if (filters.start_date_to) {
        query = query.lte('start_date', filters.start_date_to);
      }
      
      if (filters.manager_id) {
        query = query.eq('tour_manager_id', filters.manager_id);
      }
      
      if (filters.agency_id) {
        query = query.eq('agency_id', filters.agency_id);
      }
      
      if (filters.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public);
      }
    }

    // Apply search
    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }

    // Apply sorting
    const sortBy = params.sort_by || 'created_at';
    const sortOrder = params.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: tours, error, count } = await query;

    if (error) throw error;

    return {
      tours: tours || [],
      total: count || 0,
      page,
      limit,
      has_more: count ? offset + limit < count : false
    };
  }

  async deleteTour(id: string): Promise<void> {
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getTourStatistics(id: string): Promise<TourStatistics> {
    const { data, error } = await supabase
      .rpc('calculate_tour_statistics', { _tour_id: id });

    if (error) throw error;
    return data;
  }

  // =====================================
  // TOUR STOPS MANAGEMENT
  // =====================================

  async createTourStop(data: CreateTourStopRequest): Promise<TourStop> {
    const { data: stop, error } = await supabase
      .from('tour_stops')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return stop;
  }

  async updateTourStop(id: string, data: Partial<CreateTourStopRequest>): Promise<TourStop> {
    const { data: stop, error } = await supabase
      .from('tour_stops')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return stop;
  }

  async getTourStops(tourId: string): Promise<TourStop[]> {
    const { data, error } = await supabase
      .from('tour_stops')
      .select('*')
      .eq('tour_id', tourId)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  async getTourStop(id: string): Promise<TourStop | null> {
    const { data, error } = await supabase
      .from('tour_stops')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async deleteTourStop(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_stops')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getTourStopWithDetails(id: string): Promise<TourStopWithDetails | null> {
    const stop = await this.getTourStop(id);
    if (!stop) return null;

    const [participants, logistics, expenses, revenue] = await Promise.all([
      this.getTourParticipants(stop.tour_id),
      this.getTourLogistics(stop.tour_id, id),
      this.getTourExpenses(stop.tour_id, id),
      this.getTourRevenue(stop.tour_id, id)
    ]);

    return {
      ...stop,
      participants,
      logistics,
      expenses,
      revenue
    };
  }

  // =====================================
  // TOUR PARTICIPANTS MANAGEMENT
  // =====================================

  async createTourParticipant(data: CreateTourParticipantRequest): Promise<TourParticipant> {
    const { data: participant, error } = await supabase
      .from('tour_participants')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return participant;
  }

  async updateTourParticipant(id: string, data: Partial<CreateTourParticipantRequest>): Promise<TourParticipant> {
    const { data: participant, error } = await supabase
      .from('tour_participants')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return participant;
  }

  async getTourParticipants(tourId: string): Promise<TourParticipantWithUser[]> {
    const { data, error } = await supabase
      .from('tour_participants')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('tour_id', tourId)
      .order('is_headliner', { ascending: false })
      .order('performance_order');

    if (error) throw error;
    return data || [];
  }

  async deleteTourParticipant(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_participants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // TOUR COLLABORATIONS MANAGEMENT
  // =====================================

  async createTourCollaboration(data: CreateTourCollaborationRequest): Promise<TourCollaboration> {
    const { data: collaboration, error } = await supabase
      .from('tour_collaborations')
      .insert([{
        ...data,
        invitation_sent_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return collaboration;
  }

  async updateTourCollaboration(id: string, data: Partial<CreateTourCollaborationRequest>): Promise<TourCollaboration> {
    const { data: collaboration, error } = await supabase
      .from('tour_collaborations')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return collaboration;
  }

  async getTourCollaborations(tourId: string): Promise<TourCollaborationWithUser[]> {
    const { data, error } = await supabase
      .from('tour_collaborations')
      .select(`
        *,
        collaborator:collaborator_id (
          id,
          name,
          email,
          avatar_url,
          company_name
        )
      `)
      .eq('tour_id', tourId)
      .order('contact_priority');

    if (error) throw error;
    return data || [];
  }

  async respondToCollaboration(id: string, accept: boolean): Promise<TourCollaboration> {
    const updateData: any = {
      status: accept ? 'confirmed' : 'declined',
      responded_at: new Date().toISOString()
    };

    if (accept) {
      updateData.joined_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tour_collaborations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTourCollaboration(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_collaborations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // TOUR LOGISTICS MANAGEMENT
  // =====================================

  async createTourLogistics(data: CreateTourLogisticsRequest): Promise<TourLogistics> {
    const { data: logistics, error } = await supabase
      .from('tour_logistics')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return logistics;
  }

  async updateTourLogistics(id: string, data: Partial<CreateTourLogisticsRequest>): Promise<TourLogistics> {
    const { data: logistics, error } = await supabase
      .from('tour_logistics')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return logistics;
  }

  async getTourLogistics(tourId: string, stopId?: string): Promise<TourLogistics[]> {
    let query = supabase
      .from('tour_logistics')
      .select('*')
      .eq('tour_id', tourId);

    if (stopId) {
      query = query.eq('tour_stop_id', stopId);
    }

    const { data, error } = await query.order('start_date').order('start_time');

    if (error) throw error;
    return data || [];
  }

  async deleteTourLogistics(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_logistics')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // TOUR EXPENSES MANAGEMENT
  // =====================================

  async createTourExpense(data: CreateTourExpenseRequest): Promise<TourExpense> {
    const { data: expense, error } = await supabase
      .from('tour_expenses')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return expense;
  }

  async updateTourExpense(id: string, data: Partial<CreateTourExpenseRequest>): Promise<TourExpense> {
    const { data: expense, error } = await supabase
      .from('tour_expenses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return expense;
  }

  async getTourExpenses(tourId: string, stopId?: string): Promise<TourExpense[]> {
    let query = supabase
      .from('tour_expenses')
      .select('*')
      .eq('tour_id', tourId);

    if (stopId) {
      query = query.eq('tour_stop_id', stopId);
    }

    const { data, error } = await query.order('expense_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async deleteTourExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // TOUR REVENUE MANAGEMENT
  // =====================================

  async createTourRevenue(data: CreateTourRevenueRequest): Promise<TourRevenue> {
    const { data: revenue, error } = await supabase
      .from('tour_revenue')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return revenue;
  }

  async updateTourRevenue(id: string, data: Partial<CreateTourRevenueRequest>): Promise<TourRevenue> {
    const { data: revenue, error } = await supabase
      .from('tour_revenue')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return revenue;
  }

  async getTourRevenue(tourId: string, stopId?: string): Promise<TourRevenue[]> {
    let query = supabase
      .from('tour_revenue')
      .select('*')
      .eq('tour_id', tourId);

    if (stopId) {
      query = query.eq('tour_stop_id', stopId);
    }

    const { data, error } = await query.order('revenue_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async deleteTourRevenue(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_revenue')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // TOUR ITINERARY MANAGEMENT
  // =====================================

  async createTourItinerary(data: Omit<TourItinerary, 'id' | 'created_at' | 'updated_at'>): Promise<TourItinerary> {
    const { data: itinerary, error } = await supabase
      .from('tour_itinerary')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return itinerary;
  }

  async updateTourItinerary(id: string, data: Partial<TourItinerary>): Promise<TourItinerary> {
    const { data: itinerary, error } = await supabase
      .from('tour_itinerary')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return itinerary;
  }

  async getTourItinerary(tourId: string, stopId?: string): Promise<TourItinerary[]> {
    let query = supabase
      .from('tour_itinerary')
      .select('*')
      .eq('tour_id', tourId);

    if (stopId) {
      query = query.eq('tour_stop_id', stopId);
    }

    const { data, error } = await query.order('date').order('order_index');

    if (error) throw error;
    return data || [];
  }

  async deleteTourItinerary(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_itinerary')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // DASHBOARD AND ANALYTICS
  // =====================================

  async getTourDashboardStats(managerId?: string): Promise<TourDashboardStats> {
    // This would be implemented with complex queries or stored procedures
    // For now, returning a basic structure
    const { data: tours, error } = await supabase
      .from('tours')
      .select('*')
      .eq(managerId ? 'tour_manager_id' : 'id', managerId || 'all');

    if (error) throw error;

    // Calculate basic stats
    const totalTours = tours?.length || 0;
    const activeTours = tours?.filter(t => t.status === 'in_progress').length || 0;
    const totalRevenue = tours?.reduce((sum, t) => sum + (t.actual_revenue || 0), 0) || 0;

    return {
      total_tours: totalTours,
      active_tours: activeTours,
      upcoming_shows: 0, // Would need to calculate from tour_stops
      total_revenue: totalRevenue,
      total_expenses: 0, // Would need to calculate from tour_expenses
      net_profit: totalRevenue, // Simplified calculation
      average_occupancy: 0, // Would need to calculate from tour_stops
      tours_by_status: {
        planning: 0,
        confirmed: 0,
        in_progress: activeTours,
        completed: 0,
        cancelled: 0,
        postponed: 0
      },
      monthly_revenue: [],
      top_performing_cities: []
    };
  }

  async getTourCalendarEvents(tourId: string): Promise<TourCalendarEvent[]> {
    const { data: stops, error } = await supabase
      .from('tour_stops')
      .select('*')
      .eq('tour_id', tourId)
      .order('event_date');

    if (error) throw error;

    return (stops || []).map(stop => ({
      id: stop.id,
      title: `${stop.venue_name} - ${stop.venue_city}`,
      start: stop.event_date,
      end: stop.event_date,
      type: 'show' as const,
      tour_id: tourId,
      tour_stop_id: stop.id,
      venue_name: stop.venue_name,
      venue_city: stop.venue_city,
      status: stop.status,
      description: stop.notes,
      color: this.getEventColor(stop.status)
    }));
  }

  private getEventColor(status: string): string {
    const colors = {
      planned: '#94a3b8',
      confirmed: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444',
      postponed: '#f59e0b'
    };
    return colors[status as keyof typeof colors] || '#94a3b8';
  }

  // =====================================
  // BULK OPERATIONS
  // =====================================

  async bulkCreateTourStops(tourId: string, stops: Omit<CreateTourStopRequest, 'tour_id'>[]): Promise<TourStop[]> {
    const stopsWithTourId = stops.map(stop => ({ ...stop, tour_id: tourId }));
    
    const { data, error } = await supabase
      .from('tour_stops')
      .insert(stopsWithTourId)
      .select();

    if (error) throw error;
    return data || [];
  }

  async bulkUpdateTourStops(updates: Array<{ id: string; data: Partial<TourStop> }>): Promise<TourStop[]> {
    const results = await Promise.all(
      updates.map(update => this.updateTourStop(update.id, update.data))
    );
    return results;
  }

  async duplicateTour(tourId: string, newName: string): Promise<Tour> {
    const tourDetails = await this.getTourWithDetails(tourId);
    if (!tourDetails) throw new Error('Tour not found');

    // Create new tour
    const newTour = await this.createTour({
      ...tourDetails.tour_data,
      name: newName,
      status: 'planning',
      actual_revenue: 0,
      tickets_sold: 0,
      gross_sales: 0
    });

    // Copy tour stops
    if (tourDetails.stops_data.length > 0) {
      const stops = tourDetails.stops_data.map(stop => ({
        ...stop,
        tour_id: newTour.id,
        status: 'planned' as const,
        tickets_sold: 0,
        revenue: 0,
        expenses: 0
      }));
      await this.bulkCreateTourStops(newTour.id, stops);
    }

    return newTour;
  }

  // =====================================
  // SEARCH AND DISCOVERY
  // =====================================

  async searchTours(query: string, filters?: TourFilters): Promise<Tour[]> {
    const { tours } = await this.getTours({ query, filters, limit: 50 });
    return tours;
  }

  async getPublicTours(limit: number = 20): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('is_public', true)
      .order('start_date')
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getFeaturedTours(): Promise<Tour[]> {
    // This would implement logic to get featured tours
    // For now, returning public tours with good stats
    return this.getPublicTours(10);
  }

  async getToursByLocation(city: string, state?: string): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours')
      .select(`
        *,
        tour_stops!inner (
          venue_city,
          venue_state
        )
      `)
      .eq('tour_stops.venue_city', city)
      .eq(state ? 'tour_stops.venue_state' : 'id', state || 'all')
      .eq('is_public', true);

    if (error) throw error;
    return data || [];
  }
}

export const tourService = new TourService();