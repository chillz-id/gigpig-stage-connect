// Core Tour Service - Basic tour CRUD operations and management
import { supabase } from '@/integrations/supabase/client';
import type {
  Tour,
  TourWithDetails,
  TourStatistics,
  TourListResponse,
  TourDetailsResponse,
  TourSearchParams,
  TourFilters,
  TourDashboardStats,
  TourCalendarEvent,
  CreateTourRequest,
  UpdateTourRequest
} from '@/types/tour';

class CoreTourService {
  // =====================================
  // BASIC TOUR CRUD OPERATIONS
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
      
      if (filters.difficulty?.length) {
        query = query.in('difficulty', filters.difficulty);
      }
      
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      if (filters.date_range?.start) {
        query = query.gte('start_date', filters.date_range.start);
      }
      
      if (filters.date_range?.end) {
        query = query.lte('end_date', filters.date_range.end);
      }
      
      if (filters.price_range?.min !== undefined) {
        query = query.gte('price', filters.price_range.min);
      }
      
      if (filters.price_range?.max !== undefined) {
        query = query.lte('price', filters.price_range.max);
      }
      
      if (filters.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }
    }

    // Apply search
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    // Apply sorting
    if (params.sort) {
      const { field, direction } = params.sort;
      query = query.order(field, { ascending: direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      tours: data || [],
      total: count || 0,
      limit: params.limit || 10,
      offset: params.offset || 0
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
      .rpc('get_tour_statistics', { _tour_id: id })
      .single();

    if (error) throw error;
    return data;
  }

  // =====================================
  // TOUR SEARCH AND DISCOVERY
  // =====================================

  async searchTours(query: string, filters?: TourFilters): Promise<Tour[]> {
    let searchQuery = supabase
      .from('tours')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);

    if (filters) {
      if (filters.status?.length) {
        searchQuery = searchQuery.in('status', filters.status);
      }
      if (filters.tour_type?.length) {
        searchQuery = searchQuery.in('tour_type', filters.tour_type);
      }
      if (filters.location) {
        searchQuery = searchQuery.ilike('location', `%${filters.location}%`);
      }
    }

    const { data, error } = await searchQuery.limit(20);
    if (error) throw error;
    return data || [];
  }

  async getPublicTours(limit: number = 20): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'published')
      .order('featured_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getFeaturedTours(): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'published')
      .order('featured_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getToursByLocation(city: string, state?: string): Promise<Tour[]> {
    let query = supabase
      .from('tours')
      .select('*')
      .ilike('location', `%${city}%`);

    if (state) {
      query = query.ilike('location', `%${state}%`);
    }

    const { data, error } = await query
      .eq('status', 'published')
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // =====================================
  // TOUR DASHBOARD AND ANALYTICS
  // =====================================

  async getTourDashboardStats(managerId?: string): Promise<TourDashboardStats> {
    let query = supabase.rpc('get_tour_dashboard_stats');
    
    if (managerId) {
      query = query.eq('manager_id', managerId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  }

  async getTourCalendarEvents(tourId: string): Promise<TourCalendarEvent[]> {
    const { data, error } = await supabase
      .from('tour_stops')
      .select(`
        id,
        tour_id,
        name,
        start_date,
        end_date,
        location,
        status,
        tours!inner(
          name,
          description,
          status
        )
      `)
      .eq('tour_id', tourId)
      .order('start_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(stop => ({
      id: stop.id,
      title: stop.name,
      start: stop.start_date,
      end: stop.end_date,
      location: stop.location,
      status: stop.status,
      tour: {
        id: tourId,
        name: stop.tours.name,
        description: stop.tours.description,
        status: stop.tours.status
      }
    }));
  }

  // =====================================
  // UTILITY OPERATIONS
  // =====================================

  async duplicateTour(tourId: string, newName: string): Promise<Tour> {
    // Get the original tour
    const originalTour = await this.getTour(tourId);
    if (!originalTour) {
      throw new Error('Tour not found');
    }

    // Create new tour data
    const newTourData: CreateTourRequest = {
      ...originalTour,
      name: newName,
      status: 'draft'
    };

    // Remove fields that should not be duplicated
    delete (newTourData as any).id;
    delete (newTourData as any).created_at;
    delete (newTourData as any).updated_at;

    // Create the new tour
    const newTour = await this.createTour(newTourData);

    return newTour;
  }
}

export const tourService = new CoreTourService();
export default CoreTourService;