import { BaseApi } from '@/lib/api/base';
import { supabase } from '@/integrations/supabase/client';
import { Event, CreateEventData, UpdateEventData } from '@/types/event';

export class EventsApi extends BaseApi<Event> {
  constructor() {
    super('events');
  }
  
  // Override create to handle complex event creation
  async create(data: CreateEventData): Promise<{ data: Event | null; error: any }> {
    try {
      // Start a transaction-like operation
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          ...data,
          stage_manager_id: data.stage_manager_id || (await this.getCurrentUserId()),
        })
        .select(`
          *,
          venue:venues(*),
          stage_manager:profiles!events_stage_manager_id_fkey(*)
        `)
        .single();
      
      if (eventError) throw eventError;
      
      // Create initial event spots if provided
      if (data.spots && data.spots.length > 0 && event) {
        const spotsData = data.spots.map((spot, index) => ({
          event_id: event.id,
          performer_id: spot.performer_id,
          order_number: index + 1,
          performance_type: spot.performance_type || 'spot',
          duration_minutes: spot.duration_minutes || 5,
        }));
        
        const { error: spotsError } = await supabase
          .from('event_spots')
          .insert(spotsData);
        
        if (spotsError) {
          // Rollback by deleting the event
          await supabase.from('events').delete().eq('id', event.id);
          throw spotsError;
        }
      }
      
      return { data: event, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Get events with minimal data for listing pages
  async getEventsForListing(filters?: {
    status?: string;
    venue_id?: string;
    date_from?: string;
    date_to?: string;
    my_events?: boolean;
  }) {
    try {
      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          start_time,
          venue,
          city,
          type,
          status,
          image_url,
          ticket_price,
          ticket_url,
          total_spots,
          event_spots(count),
          applications(count)
        `)
        .eq('status', 'published'); // Only show published events
      
      // Apply filters
      if (filters?.venue_id) {
        query = query.eq('venue_id', filters.venue_id);
      }
      
      if (filters?.date_from) {
        query = query.gte('event_date', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('event_date', filters.date_to);
      }
      
      if (filters?.my_events) {
        const userId = await this.getCurrentUserId();
        if (userId) {
          query = query.or(`stage_manager_id.eq.${userId},co_promoter_ids.cs.{${userId}}`);
        }
      }
      
      // Order by date and limit results
      query = query
        .order('event_date', { ascending: true })
        .gte('event_date', new Date().toISOString().split('T')[0]) // Only future events
        .limit(100); // Limit to 100 events
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to include computed fields
      const transformedData = (data || []).map(event => ({
        ...event,
        spots_count: event.event_spots?.[0]?.count || 0,
        applications_count: event.applications?.[0]?.count || 0,
        is_full: (event.event_spots?.[0]?.count || 0) >= (event.total_spots || 0),
      }));
      
      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Get events with related data (keep for detail pages)
  async getEventsWithDetails(filters?: {
    status?: string;
    venue_id?: string;
    date_from?: string;
    date_to?: string;
    my_events?: boolean;
  }) {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          venue:venues(*),
          stage_manager:profiles!events_stage_manager_id_fkey(*),
          event_spots(
            *,
            performer:profiles(*)
          ),
          applications(count)
        `);
      
      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.venue_id) {
        query = query.eq('venue_id', filters.venue_id);
      }
      
      if (filters?.date_from) {
        query = query.gte('date', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('date', filters.date_to);
      }
      
      if (filters?.my_events) {
        const userId = await this.getCurrentUserId();
        if (userId) {
          query = query.or(`stage_manager_id.eq.${userId},co_promoter_ids.cs.{${userId}}`);
        }
      }
      
      // Order by date
      query = query.order('date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to include computed fields
      const transformedData = (data || []).map(event => ({
        ...event,
        spots_count: event.event_spots?.length || 0,
        applications_count: event.applications?.[0]?.count || 0,
        is_full: (event.event_spots?.length || 0) >= (event.total_spots || 0),
      }));
      
      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Publish/unpublish event
  async updateStatus(eventId: string, status: 'draft' | 'published') {
    return this.update(eventId, { status });
  }
  
  // Add co-promoter
  async addCoPromoter(eventId: string, promoterId: string) {
    try {
      // Get current co-promoters
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('co_promoter_ids')
        .eq('id', eventId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentCoPromoters = event.co_promoter_ids || [];
      if (currentCoPromoters.includes(promoterId)) {
        return { data: event, error: null }; // Already a co-promoter
      }
      
      // Update with new co-promoter
      const { data: updatedEvent, error: updateError } = await supabase
        .from('events')
        .update({
          co_promoter_ids: [...currentCoPromoters, promoterId]
        })
        .eq('id', eventId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return { data: updatedEvent, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Remove co-promoter
  async removeCoPromoter(eventId: string, promoterId: string) {
    try {
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('co_promoter_ids')
        .eq('id', eventId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentCoPromoters = event.co_promoter_ids || [];
      const updatedCoPromoters = currentCoPromoters.filter(id => id !== promoterId);
      
      const { data: updatedEvent, error: updateError } = await supabase
        .from('events')
        .update({
          co_promoter_ids: updatedCoPromoters
        })
        .eq('id', eventId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return { data: updatedEvent, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Helper to get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }
}

// Export singleton instance
export const eventsApi = new EventsApi();