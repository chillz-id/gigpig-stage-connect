import { BaseApi, ApiResponse } from '@/lib/api/base';
import { supabase } from '@/integrations/supabase/client';
import { Event, CreateEventData, UpdateEventData } from '@/types/event';
import { parseEventError } from '@/utils/eventErrorHandling';
import { errorService } from '@/services/errorService';
import { sessionManager } from '@/utils/sessionManager';

export class EventsApi extends BaseApi<Event> {
  constructor() {
    super('events');
  }
  
  // Override create to handle complex event creation
  async create(data: CreateEventData): Promise<{ data: Event | null; error: any }> {
    let createdEventId: string | null = null;
    
    try {
      // Validate user authentication
      const userId = await sessionManager.getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to create events');
      }

      // Enhanced logging for debugging
      console.log('[EventsApi] Creating event with data:', {
        title: data.title,
        venue: data.venue,
        date: data.event_date,
        userId,
      });

      // Start a transaction-like operation
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          ...data,
          promoter_id: data.promoter_id || userId,
        })
        .select(`
          *,
          venue:venues(*),
          promoter:profiles!events_promoter_id_fkey(*)
        `)
        .single();
      
      if (eventError) {
        console.error('[EventsApi] Event creation failed:', eventError);
        
        // Parse and enhance error for better user feedback
        const parsedError = parseEventError(eventError);
        throw {
          ...eventError,
          userMessage: parsedError.userMessage,
          field: parsedError.field,
        };
      }
      
      if (!event) {
        throw new Error('Event creation failed - no data returned');
      }
      
      createdEventId = event.id;
      console.log('[EventsApi] Event created successfully:', event.id);
      
      // Create initial event spots if provided
      if (data.spots && data.spots.length > 0) {
        console.log('[EventsApi] Creating event spots:', data.spots.length);
        
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
          console.error('[EventsApi] Event spots creation failed:', spotsError);
          
          // Rollback by deleting the event
          console.log('[EventsApi] Rolling back event creation');
          const { error: rollbackError } = await supabase
            .from('events')
            .delete()
            .eq('id', event.id);
          
          if (rollbackError) {
            console.error('[EventsApi] Rollback failed:', rollbackError);
            // Log critical error - event created but spots failed and couldn't rollback
            await errorService.logError(rollbackError, {
              category: 'database_error',
              severity: 'critical',
              component: 'EventsApi',
              action: 'rollback_event_creation',
              metadata: {
                eventId: event.id,
                originalError: spotsError,
              },
            });
          }
          
          const parsedError = parseEventError(spotsError);
          throw {
            ...spotsError,
            userMessage: parsedError.userMessage || 'Failed to create event spots',
          };
        }
      }
      
      return { data: event, error: null };
    } catch (error: any) {
      // Log error with context
      await errorService.logError(error, {
        category: 'database_error',
        severity: 'high',
        component: 'EventsApi',
        action: 'create_event',
        metadata: {
          eventTitle: data.title,
          createdEventId,
          errorCode: error.code,
        },
      });
      
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
    include_past?: boolean;
    include_drafts?: boolean;
    owner_id?: string;
  }) {
    try {
      console.log('[EventsApi] getEventsForListing called with filters:', filters);
      
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
          promoter_id,
          co_promoter_ids,
          event_spots(count),
          applications(count)
        `);
      
      // Filter by status - more flexible now
      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else if (!filters?.include_drafts) {
        // By default, exclude drafts unless specifically requested
        query = query.in('status', ['open', 'closed', 'completed', 'cancelled']);
      }
      
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
        const userId = await sessionManager.getCurrentUserId();
        if (userId) {
          query = query.or(`promoter_id.eq.${userId},co_promoter_ids.cs.{${userId}}`);
        }
      }
      
      // Include past events if requested, otherwise only future events
      if (!filters?.include_past) {
        query = query.gte('event_date', new Date().toISOString().split('T')[0]);
      }
      
      // Include drafts for event owners if requested
      if (filters?.include_drafts && filters?.owner_id) {
        // This will show drafts only to the owner
        query = query.or(`status.eq.draft,promoter_id.eq.${filters.owner_id},co_promoter_ids.cs.{${filters.owner_id}}`);
      }
      
      // Order by date and limit results
      query = query
        .order('event_date', { ascending: true })
        .limit(200); // Increased limit for better discovery
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[EventsApi] Query error:', error);
        throw error;
      }
      
      console.log('[EventsApi] Query returned', data?.length || 0, 'events');
      
      // Transform the data to include computed fields
      const transformedData = (data || []).map(event => {
        const eventDate = new Date(event.event_date);
        const now = new Date();
        const isPast = eventDate < now;
        
        return {
          ...event,
          spots_count: event.event_spots?.[0]?.count || 0,
          applications_count: event.applications?.[0]?.count || 0,
          is_full: (event.event_spots?.[0]?.count || 0) >= (event.total_spots || 0),
          is_past: isPast,
          days_until: isPast ? null : Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        };
      });
      
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
          promoter:profiles!events_promoter_id_fkey(*),
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
        query = query.gte('event_date', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('event_date', filters.date_to);
      }
      
      if (filters?.my_events) {
        const userId = await sessionManager.getCurrentUserId();
        if (userId) {
          query = query.or(`promoter_id.eq.${userId},co_promoter_ids.cs.{${userId}}`);
        }
      }
      
      // Order by date
      query = query.order('event_date', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to include computed fields
      const transformedData = (data || []).map(event => ({
        ...event,
        spots_count: event.event_spots?.length || 0,
        applications_count: event.applications?.[0]?.count || 0,
        total_spots: event.spots, // Add alias for compatibility
        is_full: (event.event_spots?.length || 0) >= (event.spots || 0),
      }));
      
      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  
  // Update event status with enhanced error handling
  async updateStatus(eventId: string, status: 'draft' | 'open' | 'closed' | 'cancelled' | 'completed') {
    try {
      const result = await this.update(eventId, { status });
      
      if (result.error) {
        const parsedError = parseEventError(result.error);
        throw {
          ...result.error,
          userMessage: parsedError.userMessage || `Failed to update event status to ${status}`,
        };
      }
      
      return result;
    } catch (error) {
      await errorService.logError(error as Error, {
        category: 'database_error',
        severity: 'medium',
        component: 'EventsApi',
        action: 'update_event_status',
        metadata: {
          eventId,
          newStatus: status,
        },
      });
      
      throw error;
    }
  }
  
  // Update draft event with enhanced validation
  async updateDraft(eventId: string, data: UpdateEventData): Promise<ApiResponse<Event>> {
    try {
      // First, verify the event exists and is a draft
      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('status, promoter_id')
        .eq('id', eventId)
        .single();
      
      if (fetchError) {
        const parsedError = parseEventError(fetchError);
        throw {
          ...fetchError,
          userMessage: parsedError.userMessage || 'Event not found',
        };
      }
      
      // Verify it's a draft
      if (existingEvent.status !== 'draft') {
        throw new Error('Only draft events can be auto-saved. Please use the regular update method for published events.');
      }
      
      // Verify user has permission (is the promoter)
      const userId = await sessionManager.getCurrentUserId();
      if (!userId || existingEvent.promoter_id !== userId) {
        throw new Error('You do not have permission to update this event');
      }
      
      // Use the base update method with enhanced error handling
      const result = await this.update(eventId, data);
      
      if (result.error) {
        const parsedError = parseEventError(result.error);
        throw {
          ...result.error,
          userMessage: parsedError.userMessage || 'Failed to update draft',
        };
      }
      
      console.log('[EventsApi] Draft updated successfully:', eventId);
      return result;
    } catch (error) {
      await errorService.logError(error as Error, {
        category: 'database_error',
        severity: 'medium',
        component: 'EventsApi',
        action: 'update_draft',
        metadata: {
          eventId,
          updateFields: Object.keys(data),
        },
      });
      
      return { data: null, error };
    }
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
  
  // Helper to get current user ID with error handling
  private async getCurrentUserId(): Promise<string | null> {
    try {
      // Use session manager for better session handling
      const userId = await sessionManager.getCurrentUserId();
      
      if (!userId) {
        console.error('[EventsApi] No authenticated user found');
        throw new Error('Authentication required');
      }
      
      return userId;
    } catch (error) {
      await errorService.logError(error as Error, {
        category: 'authentication_error',
        severity: 'high',
        component: 'EventsApi',
        action: 'get_current_user',
      });
      
      throw error;
    }
  }
}

// Export singleton instance
export const eventsApi = new EventsApi();