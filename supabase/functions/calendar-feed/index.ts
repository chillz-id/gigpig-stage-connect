import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

/**
 * Calendar Feed Edge Function
 *
 * Serves iCalendar feeds for comedian gigs via secure token authentication.
 *
 * URL format: /calendar-feed/:token.ics
 * Example: https://your-project.supabase.co/functions/v1/calendar-feed/abc123def456.ics
 *
 * Returns:
 * - 200: Valid iCalendar feed (text/calendar)
 * - 401: Invalid or inactive token
 * - 404: No subscription found
 * - 500: Server error
 */

interface ManualGig {
  id: string;
  title: string;
  venue_name: string | null;
  venue_address: string | null;
  start_datetime: string;
  end_datetime: string | null;
  notes: string | null;
}

interface PlatformGig {
  id: string;
  event: {
    name: string;
    venue_name: string | null;
    venue_address: string | null;
    start_date: string;
    start_time: string | null;
  };
}

interface CalendarEvent {
  uid: string;
  summary: string;
  location: string;
  dtstart: string;
  dtend: string | null;
  description: string;
  created: string;
  source: 'manual' | 'platform';
}

/**
 * Generate RFC 5545 compliant iCalendar format
 */
class ICalGenerator {
  private events: CalendarEvent[] = [];

  addEvent(event: CalendarEvent): void {
    this.events.push(event);
  }

  /**
   * Format date to iCalendar format: YYYYMMDDTHHMMSSZ
   */
  private formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Escape special characters per RFC 5545
   */
  private escape(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Generate complete iCalendar file
   */
  generate(): string {
    const lines: string[] = [];

    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Stand Up Sydney//Gig Calendar//EN');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');
    lines.push('X-WR-CALNAME:My Gigs - Stand Up Sydney');
    lines.push('X-WR-TIMEZONE:Australia/Sydney');
    lines.push('X-WR-CALDESC:Your confirmed gigs and personal bookings');

    for (const event of this.events) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.uid}@standupsydney.com`);
      lines.push(`SUMMARY:${this.escape(event.summary)}`);
      lines.push(`DTSTART:${this.formatDateTime(event.dtstart)}`);

      if (event.dtend) {
        lines.push(`DTEND:${this.formatDateTime(event.dtend)}`);
      }

      if (event.location) {
        lines.push(`LOCATION:${this.escape(event.location)}`);
      }

      if (event.description) {
        lines.push(`DESCRIPTION:${this.escape(event.description)}`);
      }

      lines.push(`DTSTAMP:${this.formatDateTime(event.created)}`);
      lines.push(`STATUS:CONFIRMED`);
      lines.push(`TRANSP:OPAQUE`);

      // Add source metadata
      lines.push(`X-STANDUPSYDNEY-SOURCE:${event.source}`);

      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    // RFC 5545 requires CRLF line endings
    return lines.join('\r\n');
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract token from URL path
    const url = new URL(req.url);
    const pathMatch = url.pathname.match(/\/([^\/]+)\.ics$/);

    if (!pathMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format. Expected: /calendar-feed/:token.ics' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = pathMatch[1];

    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token and get user_id
    const { data: subscription, error: subError } = await supabase
      .from('calendar_subscriptions')
      .select('id, user_id, is_active')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (subError || !subscription) {
      console.error('Invalid token:', subError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired calendar subscription' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = subscription.user_id;

    // Update last_accessed_at timestamp (fire and forget)
    supabase
      .from('calendar_subscriptions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', subscription.id)
      .then(() => {})
      .catch((err) => console.error('Failed to update last_accessed_at:', err));

    // Fetch manual gigs
    const { data: manualGigs, error: manualError } = await supabase
      .from('manual_gigs')
      .select('id, title, venue_name, venue_address, start_datetime, end_datetime, notes, created_at')
      .eq('user_id', userId)
      .order('start_datetime', { ascending: true });

    if (manualError) {
      console.error('Error fetching manual gigs:', manualError);
    }

    // Fetch confirmed platform gigs (accepted applications)
    const { data: platformGigs, error: platformError } = await supabase
      .from('applications')
      .select(`
        id,
        created_at,
        event:event_id (
          name,
          venue_name,
          venue_address,
          start_date,
          start_time
        )
      `)
      .eq('comedian_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true });

    if (platformError) {
      console.error('Error fetching platform gigs:', platformError);
    }

    // Generate iCalendar feed
    const generator = new ICalGenerator();

    // Add manual gigs
    if (manualGigs && manualGigs.length > 0) {
      for (const gig of manualGigs) {
        const location = [gig.venue_name, gig.venue_address].filter(Boolean).join(', ');

        generator.addEvent({
          uid: `manual-${gig.id}`,
          summary: gig.title,
          location,
          dtstart: gig.start_datetime,
          dtend: gig.end_datetime || null,
          description: gig.notes || 'Personal booking',
          created: gig.created_at || new Date().toISOString(),
          source: 'manual',
        });
      }
    }

    // Add platform gigs
    if (platformGigs && platformGigs.length > 0) {
      for (const application of platformGigs) {
        // @ts-expect-error - Supabase typing issue with nested selects
        const event = application.event;

        if (!event) continue;

        // Combine date and time
        let startDateTime = event.start_date;
        if (event.start_time) {
          // start_time is in format "HH:MM:SS"
          const datePart = event.start_date.split('T')[0];
          startDateTime = `${datePart}T${event.start_time}`;
        }

        const location = [event.venue_name, event.venue_address].filter(Boolean).join(', ');

        generator.addEvent({
          uid: `platform-${application.id}`,
          summary: event.name || 'Comedy Gig',
          location,
          dtstart: startDateTime,
          dtend: null, // Platform events don't have end times
          description: `Confirmed spot via Stand Up Sydney platform`,
          created: application.created_at || new Date().toISOString(),
          source: 'platform',
        });
      }
    }

    // Generate iCal content
    const icalContent = generator.generate();

    // Return iCalendar feed
    return new Response(icalContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="my-gigs.ics"',
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Calendar feed error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate calendar feed',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
