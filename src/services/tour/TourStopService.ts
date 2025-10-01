// Tour Stop Service - Stop management and logistics coordination
import { supabase } from '@/integrations/supabase/client';
import type {
  TourStop,
  TourLogistics,
  TourItinerary,
  CreateTourStopRequest,
  CreateTourLogisticsRequest,
  TourStopWithDetails
} from '@/types/tour';

class TourStopService {
  // =====================================
  // TOUR STOP MANAGEMENT
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
      .order('stop_order', { ascending: true });

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
    const { data, error } = await supabase
      .from('tour_stops')
      .select(`
        *,
        tours!inner(*),
        tour_logistics(*),
        tour_expenses(*),
        tour_revenue(*),
        tour_itinerary(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
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
      query = query.eq('stop_id', stopId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

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
      query = query.eq('stop_id', stopId);
    }

    const { data, error } = await query.order('scheduled_time', { ascending: true });

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
    const updatedStops: TourStop[] = [];

    for (const update of updates) {
      const stop = await this.updateTourStop(update.id, update.data);
      updatedStops.push(stop);
    }

    return updatedStops;
  }
}

export const tourStopService = new TourStopService();
export default TourStopService;