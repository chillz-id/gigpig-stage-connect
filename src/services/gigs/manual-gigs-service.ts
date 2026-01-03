import { supabase } from '@/integrations/supabase/client';

export type ShowType = 'Solo Show' | 'Showcase' | 'Open Mic' | 'Competition' | 'Festival' | 'Corporate' | 'Other';

export const SHOW_TYPES: ShowType[] = ['Solo Show', 'Showcase', 'Open Mic', 'Competition', 'Festival', 'Corporate', 'Other'];

export interface ManualGig {
  id: string;
  user_id: string;
  title: string;
  type: ShowType | null;
  venue_name: string | null;
  venue_address: string | null;
  start_datetime: string;
  end_datetime: string | null;
  notes: string | null;
  description: string | null;
  ticket_link: string | null;
  banner_url: string | null;
  created_at: string;
  updated_at: string;

  // Recurring event fields
  is_recurring: boolean;
  recurrence_pattern?: 'weekly' | 'monthly' | 'custom' | null;
  recurrence_frequency?: number | null;
  recurrence_day_of_week?: number | null; // 0-6 (Sunday=0)
  recurrence_day_of_month?: number | null; // 1-31
  recurrence_end_date?: string | null;
  recurrence_custom_dates?: string[] | null; // Array of ISO date strings
  parent_gig_id?: string | null;
}

class ManualGigsService {
  /**
   * Fetch all manual gigs for a user, ordered by start date
   */
  async getUserManualGigs(userId: string): Promise<ManualGig[]> {
    const { data, error } = await supabase
      .from('manual_gigs')
      .select('*')
      .eq('user_id', userId)
      .order('start_datetime', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new manual gig
   */
  async createManualGig(gig: Omit<ManualGig, 'id' | 'created_at' | 'updated_at'>): Promise<ManualGig> {
    console.log('🎭 [manual-gigs-service] createManualGig called with:', gig);

    const { data, error } = await supabase
      .from('manual_gigs')
      .insert(gig)
      .select()
      .single();

    if (error) {
      console.error('❌ [manual-gigs-service] Insert error:', error);
      throw error;
    }

    console.log('✅ [manual-gigs-service] Insert successful:', data);
    return data;
  }

  /**
   * Update an existing manual gig
   */
  async updateManualGig(gigId: string, updates: Partial<ManualGig>): Promise<ManualGig> {
    const { data, error } = await supabase
      .from('manual_gigs')
      .update(updates)
      .eq('id', gigId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a manual gig
   */
  async deleteManualGig(gigId: string): Promise<void> {
    const { error } = await supabase
      .from('manual_gigs')
      .delete()
      .eq('id', gigId);

    if (error) throw error;
  }

  /**
   * Calculate the next occurrence date based on recurrence pattern
   */
  private getNextOccurrence(
    currentDate: Date,
    pattern: 'weekly' | 'monthly' | 'custom',
    frequency: number,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    const next = new Date(currentDate);

    if (pattern === 'weekly') {
      // Add frequency weeks
      next.setDate(next.getDate() + (frequency * 7));
    } else if (pattern === 'monthly') {
      // Add frequency months
      next.setMonth(next.getMonth() + frequency);

      // If dayOfMonth specified, set to that day
      if (dayOfMonth) {
        next.setDate(dayOfMonth);
      }
    }

    return next;
  }

  /**
   * Generate recurring instances from a parent gig
   */
  async generateRecurringInstances(
    parentGig: ManualGig,
    maxInstances: number = 100
  ): Promise<Omit<ManualGig, 'id' | 'created_at' | 'updated_at'>[]> {
    if (!parentGig.is_recurring || !parentGig.recurrence_pattern) {
      return [];
    }

    const instances: Omit<ManualGig, 'id' | 'created_at' | 'updated_at'>[] = [];
    const startDate = new Date(parentGig.start_datetime);
    const endDate = parentGig.recurrence_end_date
      ? new Date(parentGig.recurrence_end_date)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months ahead

    // For custom pattern, use the custom dates array
    if (parentGig.recurrence_pattern === 'custom' && parentGig.recurrence_custom_dates) {
      parentGig.recurrence_custom_dates.forEach((dateStr) => {
        if (instances.length >= maxInstances) return;

        const instanceDate = new Date(dateStr);
        if (instanceDate > startDate && instanceDate <= endDate) {
          // Calculate end time based on original duration
          const originalStart = new Date(parentGig.start_datetime);
          const originalEnd = parentGig.end_datetime ? new Date(parentGig.end_datetime) : null;
          const durationMs = originalEnd ? originalEnd.getTime() - originalStart.getTime() : 0;

          const instanceEndDate = durationMs > 0
            ? new Date(instanceDate.getTime() + durationMs).toISOString()
            : null;

          instances.push({
            user_id: parentGig.user_id,
            title: parentGig.title,
            type: parentGig.type,
            venue_name: parentGig.venue_name,
            venue_address: parentGig.venue_address,
            start_datetime: instanceDate.toISOString(),
            end_datetime: instanceEndDate,
            notes: parentGig.notes,
            description: parentGig.description,
            ticket_link: parentGig.ticket_link,
            banner_url: parentGig.banner_url,
            is_recurring: false,
            parent_gig_id: parentGig.id,
            recurrence_pattern: null,
            recurrence_frequency: null,
            recurrence_day_of_week: null,
            recurrence_day_of_month: null,
            recurrence_end_date: null,
            recurrence_custom_dates: null
          });
        }
      });
    } else {
      // For weekly/monthly patterns, generate occurrences
      let currentDate = new Date(startDate);

      // Start from the next occurrence
      currentDate = this.getNextOccurrence(
        currentDate,
        parentGig.recurrence_pattern,
        parentGig.recurrence_frequency || 1,
        parentGig.recurrence_day_of_week || undefined,
        parentGig.recurrence_day_of_month || undefined
      );

      while (currentDate <= endDate && instances.length < maxInstances) {
        // Calculate end time based on original duration
        const originalStart = new Date(parentGig.start_datetime);
        const originalEnd = parentGig.end_datetime ? new Date(parentGig.end_datetime) : null;
        const durationMs = originalEnd ? originalEnd.getTime() - originalStart.getTime() : 0;

        const instanceEndDate = durationMs > 0
          ? new Date(currentDate.getTime() + durationMs).toISOString()
          : null;

        instances.push({
          user_id: parentGig.user_id,
          title: parentGig.title,
          type: parentGig.type,
          venue_name: parentGig.venue_name,
          venue_address: parentGig.venue_address,
          start_datetime: currentDate.toISOString(),
          end_datetime: instanceEndDate,
          notes: parentGig.notes,
          description: parentGig.description,
          ticket_link: parentGig.ticket_link,
          banner_url: parentGig.banner_url,
          is_recurring: false,
          parent_gig_id: parentGig.id,
          recurrence_pattern: null,
          recurrence_frequency: null,
          recurrence_day_of_week: null,
          recurrence_day_of_month: null,
          recurrence_end_date: null,
          recurrence_custom_dates: null
        });

        // Get next occurrence
        currentDate = this.getNextOccurrence(
          currentDate,
          parentGig.recurrence_pattern,
          parentGig.recurrence_frequency || 1,
          parentGig.recurrence_day_of_week || undefined,
          parentGig.recurrence_day_of_month || undefined
        );
      }
    }

    return instances;
  }

  /**
   * Create a recurring gig (parent) and its instances
   */
  async createRecurringGig(
    gigData: Omit<ManualGig, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ parent: ManualGig; instances: ManualGig[]; count: number }> {
    console.log('🔄 [manual-gigs-service] Creating recurring gig:', gigData);

    // First, create the parent gig
    const { data: parentGig, error: parentError } = await supabase
      .from('manual_gigs')
      .insert({
        ...gigData,
        is_recurring: true
      })
      .select()
      .single();

    if (parentError) {
      console.error('❌ [manual-gigs-service] Parent insert error:', parentError);
      throw parentError;
    }

    console.log('✅ [manual-gigs-service] Parent created:', parentGig.id);

    // Generate instances
    const instancesData = await this.generateRecurringInstances(parentGig);

    if (instancesData.length === 0) {
      console.log('⚠️ [manual-gigs-service] No instances generated');
      return { parent: parentGig, instances: [], count: 0 };
    }

    console.log(`🔄 [manual-gigs-service] Inserting ${instancesData.length} instances`);

    // Insert all instances
    const { data: instances, error: instancesError } = await supabase
      .from('manual_gigs')
      .insert(instancesData)
      .select();

    if (instancesError) {
      console.error('❌ [manual-gigs-service] Instances insert error:', instancesError);
      // Rollback: delete parent
      await this.deleteManualGig(parentGig.id);
      throw instancesError;
    }

    console.log(`✅ [manual-gigs-service] Created ${instances?.length || 0} instances`);

    return {
      parent: parentGig,
      instances: instances || [],
      count: instances?.length || 0
    };
  }

  /**
   * Delete a recurring gig and optionally its future instances
   */
  async deleteRecurringGig(
    gigId: string,
    deleteFutureInstances: boolean = true
  ): Promise<void> {
    if (deleteFutureInstances) {
      // Delete all future instances (CASCADE will handle this automatically)
      await this.deleteManualGig(gigId);
    } else {
      // Just delete this single gig
      await this.deleteManualGig(gigId);
    }
  }
}

export const manualGigsService = new ManualGigsService();
