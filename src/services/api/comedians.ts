import { BaseApi } from '@/lib/api/base';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/event';

export interface Comedian extends Profile {
  role: 'comedian';
  total_spots?: number;
  upcoming_shows?: number;
  past_shows?: number;
  average_rating?: number;
}

export interface ComedianFilters {
  search?: string;
  sortBy?: 'name' | 'experience' | 'rating' | 'recent';
  availability?: 'available' | 'all';
}

export class ComediansApi extends BaseApi<Comedian> {
  constructor() {
    super('profiles');
  }
  
  // Get comedians with performance stats
  async getComediansWithStats(filters?: ComedianFilters) {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          event_spots!performer_id(
            count,
            event:events(
              date,
              status
            )
          )
        `)
        .eq('role', 'comedian');
      
      // Apply search filter
      if (filters?.search) {
        // Sanitize search input to prevent SQL injection
        const sanitizedSearch = filters.search.replace(/[%_]/g, '\\$&');
        query = query.or(`full_name.ilike.%${sanitizedSearch}%,stage_name.ilike.%${sanitizedSearch}%`);
      }
      
      // Apply sorting
      switch (filters?.sortBy) {
        case 'name':
          query = query.order('full_name', { ascending: true });
          break;
        case 'experience':
          // This would need a computed column or post-processing
          query = query.order('created_at', { ascending: true });
          break;
        case 'rating':
          // This would need ratings implementation
          query = query.order('created_at', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data to include computed stats
      const currentDate = new Date().toISOString();
      const transformedData = (data || []).map(comedian => {
        const spots = comedian.event_spots || [];
        const upcomingShows = spots.filter((spot: any) => 
          spot.event?.date >= currentDate && spot.event?.status === 'published'
        ).length;
        const pastShows = spots.filter((spot: any) => 
          spot.event?.date < currentDate
        ).length;
        
        return {
          ...comedian,
          total_spots: spots.length,
          upcoming_shows: upcomingShows,
          past_shows: pastShows,
          average_rating: 0, // Placeholder for ratings
          event_spots: undefined // Remove nested data
        };
      });
      
      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Get comedian availability for a specific date range
  async getComedianAvailability(comedianId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('comedian_availability')
        .select('*')
        .eq('comedian_id', comedianId)
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) throw error;
      
      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Update comedian availability
  async updateAvailability(comedianId: string, date: string, isAvailable: boolean) {
    try {
      const { data, error } = await supabase
        .from('comedian_availability')
        .upsert({
          comedian_id: comedianId,
          date,
          is_available: isAvailable
        }, {
          onConflict: 'comedian_id,date'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Get comedian's upcoming gigs
  async getUpcomingGigs(comedianId: string) {
    try {
      const currentDate = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('event_spots')
        .select(`
          *,
          event:events(
            *,
            venue:venues(*),
            stage_manager:profiles!events_stage_manager_id_fkey(*)
          )
        `)
        .eq('performer_id', comedianId)
        .gte('event.date', currentDate)
        .eq('event.status', 'published')
        .order('event.date', { ascending: true });
      
      if (error) throw error;
      
      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Get comedian's past performances
  async getPastPerformances(comedianId: string, limit = 10) {
    try {
      const currentDate = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('event_spots')
        .select(`
          *,
          event:events(
            *,
            venue:venues(*)
          )
        `)
        .eq('performer_id', comedianId)
        .lt('event.date', currentDate)
        .order('event.date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const comediansApi = new ComediansApi();