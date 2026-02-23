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
      // Query from comedians table with profile data joined
      let query = supabase
        .from('comedians')
        .select(`
          *,
          profiles!inner(
            id,
            name,
            email,
            avatar_url,
            profile_slug,
            profile_visible,
            bio,
            location
          ),
          event_spots(
            id,
            event:events(
              date,
              status
            )
          )
        `)
        .eq('active', true)
        .eq('profiles.profile_visible', true); // Only show visible profiles in browse/search

      // Apply search filter
      if (filters?.search) {
        // Sanitize search input to prevent SQL injection
        const sanitizedSearch = filters.search.replace(/[%_]/g, '\\$&');
        query = query.or(`stage_name.ilike.%${sanitizedSearch}%,profiles.name.ilike.%${sanitizedSearch}%`);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'name':
          query = query.order('stage_name', { ascending: true });
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

      // Transform data to include computed stats and flatten profile data
      const currentDate = new Date().toISOString();
      const transformedData = (data || []).map((comedian: any) => {
        const spots = comedian.event_spots || [];
        const profile = comedian.profiles || {};
        const upcomingShows = spots.filter((spot: any) =>
          spot.event?.date >= currentDate && spot.event?.status === 'published'
        ).length;
        const pastShows = spots.filter((spot: any) =>
          spot.event?.date < currentDate
        ).length;

        return {
          ...comedian,
          // Flatten profile data
          name: comedian.stage_name || profile.name,
          email: profile.email,
          avatar_url: comedian.headshot_url || profile.avatar_url,
          profile_slug: comedian.url_slug || profile.profile_slug,
          bio: comedian.short_bio || profile.bio,
          location: comedian.origin_city || profile.location,
          // Computed stats
          total_spots: spots.length,
          upcoming_shows: upcomingShows,
          past_shows: pastShows,
          average_rating: 0, // Placeholder for ratings
          // Clean up nested data
          profiles: undefined,
          event_spots: undefined
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
      const currentDate = new Date();

      // Note: We filter by date client-side because PostgREST doesn't support .gte()/.eq() on embedded fields
      const { data, error } = await supabase
        .from('event_spots')
        .select(`
          *,
          event:events(
            *,
            venue:venues(*),
            organization:organization_profiles!events_organization_id_fkey(*)
          )
        `)
        .eq('performer_id', comedianId);

      if (error) throw error;

      // Filter to upcoming published events and sort by date
      const filteredData = (data || [])
        .filter((spot: any) => {
          const eventDate = spot.event?.date;
          const eventStatus = spot.event?.status;
          return eventDate && new Date(eventDate) >= currentDate && eventStatus === 'published';
        })
        .sort((a: any, b: any) => {
          const dateA = a.event?.date ? new Date(a.event.date).getTime() : 0;
          const dateB = b.event?.date ? new Date(b.event.date).getTime() : 0;
          return dateA - dateB;
        });

      return { data: filteredData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Get comedian's past performances
  async getPastPerformances(comedianId: string, limit = 10) {
    try {
      const currentDate = new Date();

      // Note: We filter by date client-side because PostgREST doesn't support .lt() on embedded fields
      const { data, error } = await supabase
        .from('event_spots')
        .select(`
          *,
          event:events(
            *,
            venue:venues(*)
          )
        `)
        .eq('performer_id', comedianId);

      if (error) throw error;

      // Filter to past events, sort by date descending, and apply limit
      const filteredData = (data || [])
        .filter((spot: any) => {
          const eventDate = spot.event?.date;
          return eventDate && new Date(eventDate) < currentDate;
        })
        .sort((a: any, b: any) => {
          const dateA = a.event?.date ? new Date(a.event.date).getTime() : 0;
          const dateB = b.event?.date ? new Date(b.event.date).getTime() : 0;
          return dateB - dateA; // Descending
        })
        .slice(0, limit);

      return { data: filteredData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const comediansApi = new ComediansApi();