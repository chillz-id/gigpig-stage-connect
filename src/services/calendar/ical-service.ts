import { supabase } from '@/integrations/supabase/client';
import { manualGigsService } from '@/services/gigs/manual-gigs-service';
import { ICalGenerator } from '@/utils/ical-generator';
import { UnifiedGig } from '@/hooks/useUnifiedGigs';

/**
 * Service for generating and managing iCalendar feeds
 * Provides RFC 5545 compliant .ics file generation for calendar subscriptions
 */
export class ICalService {
  /**
   * Generate iCalendar feed for a given subscription token
   * Validates token, fetches user's gigs, and generates RFC 5545 format
   *
   * @param token - Calendar subscription token
   * @returns iCalendar string or null if invalid token
   */
  async generateFeedForToken(token: string): Promise<string | null> {
    // Validate token and get user_id
    const { data: subscription, error } = await supabase
      .from('calendar_subscriptions')
      .select('user_id, is_active')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !subscription) {
      return null;
    }

    // Update last accessed timestamp
    await supabase
      .from('calendar_subscriptions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('token', token);

    // Fetch user's manual gigs
    const manualGigs = await manualGigsService.getUserManualGigs(
      subscription.user_id
    );

    // Fetch confirmed platform spots
    const { data: confirmedSpots } = await supabase
      .from('applications')
      .select(`
        id,
        event:event_id (
          name,
          venue_name,
          start_date
        )
      `)
      .eq('comedian_id', subscription.user_id)
      .eq('status', 'accepted');

    // Combine into unified format
    const unifiedGigs: UnifiedGig[] = [
      ...manualGigs.map(gig => ({
        id: gig.id,
        title: gig.title,
        venue_name: gig.venue_name,
        venue_address: gig.venue_address,
        start_datetime: gig.start_datetime,
        end_datetime: gig.end_datetime,
        notes: gig.notes,
        source: 'manual' as const,
      })),
      ...(confirmedSpots || []).map((spot: any) => ({
        id: spot.id,
        title: spot.event?.name || 'Untitled Event',
        venue_name: spot.event?.venue_name || null,
        venue_address: null,
        start_datetime: spot.event?.start_date || '',
        end_datetime: null,
        notes: null,
        source: 'platform' as const,
      })),
    ];

    // Generate iCal feed
    return ICalGenerator.fromUnifiedGigs(unifiedGigs);
  }

  /**
   * Download iCalendar file to user's device
   * Creates a Blob and triggers browser download
   *
   * @param icalContent - RFC 5545 formatted iCalendar string
   * @param filename - Name for downloaded file (default: my-gigs.ics)
   */
  downloadICalFile(icalContent: string, filename = 'my-gigs.ics'): void {
    const blob = new Blob([icalContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const icalService = new ICalService();
