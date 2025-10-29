import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from '@/utils/sessionManager';

const supabaseClient = supabase as any;

interface BrowseEventsOptions {
  startDate: string; // ISO date (yyyy-mm-dd)
  endDate: string;   // ISO date (yyyy-mm-dd)
  includePast?: boolean;
  statuses?: string[];
  type?: string;
  city?: string; // DEPRECATED - use timezone instead (city is unreliable, could be suburbs)
  timezone?: string; // Preferred filter method - e.g. 'Australia/Sydney', 'Australia/Melbourne'
  includeDraftsForOwner?: boolean;
  userId?: string | null;
}

export interface BrowseEvent {
  id: string;
  session_id?: string | null;
  supabaseEventId: string | null;
  supabaseSessionId: string | null;
  stableEventId: string;
  stableSessionId: string;
  canonicalSource: string | null;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string | null;
  type: string | null;
  ticket_price: number | null;
  ticket_url: string | null;
  external_ticket_url: string | null;
  promoter_id: string | null;
  co_promoter_ids: string[] | null;
  spots: number | null;
  applied_spots: number | null;
  filled_slots: number | null;
  is_recurring: boolean;
  is_verified_only: boolean;
  banner_url: string | null;
  image_url: string | null;
  applications_count: number;
  available_spots: number | null;
  is_full: boolean;
  is_past: boolean;
  days_until: number | null;
  is_favorited: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  waitlist_spots?: number | null;
  confirmed_lineup?: unknown;
  event_spots?: unknown;
  applications?: unknown;
  providerEventIds?: Record<string, unknown> | null;
  providerSessionIds?: Record<string, unknown> | null;
  timezone?: string | null;
  // New fields from session_complete view
  total_capacity?: number | null;
  total_ticket_count?: number | null;
  total_order_count?: number | null;
  total_gross_dollars?: string | null;
  total_net_dollars?: string | null;
}

const isLikelyIdentifier = (value: string | null | undefined): boolean => {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const hex24 = /^[0-9a-f]{24}$/i;
  if (hex24.test(trimmed)) {
    return true;
  }

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuid.test(trimmed)) {
    return true;
  }

  // If it looks like a canonical provider identifier (e.g., prefixed with numbers/letters only), treat as ID when no spaces.
  if (!trimmed.includes(' ') && /^[0-9a-z:_-]+$/i.test(trimmed) && trimmed.length >= 16) {
    return true;
  }

  return false;
};

const toTitleCase = (value: string): string => {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const deriveTitleFromUrl = (url: string | null | undefined): string | null => {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const segments = parsed.pathname
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return null;
    }

    const lastSegment = decodeURIComponent(segments[segments.length - 1]);
    if (!lastSegment) {
      return null;
    }

    const normalised = lastSegment
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalised || isLikelyIdentifier(normalised)) {
      return null;
    }

    return toTitleCase(normalised);
  } catch (error) {
    return null;
  }
};

const DEFAULT_STATUSES = ['open', 'closed', 'completed'];

export const eventBrowseService = {
  async list(options: BrowseEventsOptions): Promise<BrowseEvent[]> {
    const {
      startDate,
      endDate,
      includePast = false,
      statuses,
      type,
      city,
      timezone,
      includeDraftsForOwner = false,
      userId,
    } = options;

    const currentUserId = userId ?? await sessionManager.getCurrentUserId();

    // Expand status filter to include drafts when explicitly requested by the caller.
    const statusFilter = Array.from(
      new Set([
        ...((statuses ?? DEFAULT_STATUSES) ?? []),
        ...(includeDraftsForOwner && currentUserId ? ['draft'] : []),
      ])
    ).filter((status) => typeof status === 'string' && status.length > 0);

    let startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;

    const earliestBrowseDate = new Date('2024-01-01T00:00:00Z');
    const requestedStartDate = new Date(`${startDate}T00:00:00Z`);
    if (requestedStartDate < earliestBrowseDate) {
      startDateTime = '2024-01-01 00:00:00';
    }

    let query = supabaseClient
      .from('session_complete')
      .select(
        `
          canonical_source,
          canonical_session_source_id,
          session_name,
          event_name,
          event_source_id,
          session_start,
          session_start_local,
          timezone,
          url,
          capacity,
          banner_image_url,
          venue_lat_lng,
          venue_name,
          venue_address,
          venue_city,
          venue_country,
          is_past,
          days_until,
          latitude,
          longitude,
          total_order_count,
          total_ticket_count,
          total_gross_dollars,
          total_net_dollars,
          humanitix_order_count,
          humanitix_ticket_count,
          eventbrite_order_count,
          eventbrite_ticket_count,
          merged_sources,
          last_order_at
        `
      );

    // Note: session_complete doesn't have status or event_type columns
    // These are Humanitix/Eventbrite scraped events, not internal Supabase events
    // Filtering by status/type not applicable

    // Timezone filter (preferred) - more reliable than city filter
    if (timezone) {
      query = query.ilike('timezone', timezone);
    }

    // Legacy city filter (DEPRECATED - kept for backward compatibility)
    // Note: city can be suburb names (e.g. "Newtown", "Surry Hills") so timezone is more reliable
    if (city && !timezone) {
      query = query.ilike('venue_city', `%${city}%`);
    }

    if (!includePast) {
      query = query.eq('is_past', false);
    }

    query = query.gte('session_start_local', startDateTime);

    query = query.lte('session_start_local', endDateTime);

    query = query.order('session_start_local', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[eventBrowseService] Failed to fetch events:', error);
      throw error;
    }

    // Skip favorites for scraped events (not supported yet, would cause 404)
    // All events from session_complete are scraped from Humanitix/Eventbrite
    const favoriteEventIds = new Set<string>();

    const now = new Date();

    const friendlyTitleCache = new Map<string, string>();

    return (data ?? []).map((event) => {
      // Parse session_start_local (already in local time from view)
      // Format: "YYYY-MM-DD HH:MM:SS" in venue's local timezone
      const startLocalRaw = event.session_start_local as string | null;

      // Keep the local datetime string as-is (don't convert to UTC)
      // Just format it as ISO-like string for consistency with existing code
      const eventDateString = startLocalRaw ? startLocalRaw.replace(' ', 'T') : now.toISOString();
      const startTime = startLocalRaw ? startLocalRaw.slice(11, 16) : null;

      // These are scraped events (Humanitix/Eventbrite), not internal Supabase events
      // So supabaseEventId will always be null
      const canonicalFallback = `${event.canonical_source ?? 'session'}:${event.canonical_session_source_id ?? 'unknown'}`;
      const stableSessionId = event.canonical_session_source_id ?? canonicalFallback;
      const stableEventId = event.event_source_id ?? stableSessionId;
      // Use session ID as public ID to ensure uniqueness for recurring events
      const publicId = stableSessionId;

      // Coordinates from latitude/longitude extracted in view
      const coordinates =
        typeof event.latitude === 'number' && typeof event.longitude === 'number'
          ? {
              latitude: event.latitude,
              longitude: event.longitude,
            }
          : null;

      // Title from event_name or session_name
      let titleCandidate = event.event_name ?? event.session_name ?? null;
      if (titleCandidate && !isLikelyIdentifier(titleCandidate)) {
        friendlyTitleCache.set(stableEventId, titleCandidate);
      } else {
        const cachedTitle = friendlyTitleCache.get(stableEventId);
        if (cachedTitle) {
          titleCandidate = cachedTitle;
        } else {
          const derivedFromUrl = deriveTitleFromUrl(event.ticket_url ?? null);
          if (derivedFromUrl) {
            titleCandidate = derivedFromUrl;
            friendlyTitleCache.set(stableEventId, derivedFromUrl);
          }
        }
      }

      const finalTitle = titleCandidate ?? 'Untitled Show';

      // session_complete doesn't track applications/spots for scraped events
      // These events are external, so no internal booking/application system
      const totalCapacity = typeof event.capacity === 'number' ? event.capacity : null;

      return {
        id: publicId,
        session_id: stableSessionId,
        supabaseEventId: null, // These are all scraped events, not internal Supabase events
        supabaseSessionId: null,
        stableEventId,
        stableSessionId,
        canonicalSource: typeof event.canonical_source === 'string' ? event.canonical_source : null,
        title: finalTitle,
        event_date: eventDateString,
        start_time: startTime,
        end_time: null, // session_complete doesn't have end time
        venue: event.venue_name ?? null,
        address: event.venue_address ?? null,
        city: event.venue_city ?? null,
        state: null, // Not in session_complete
        country: event.venue_country ?? null,
        status: null, // Not applicable for scraped events
        type: null, // Not in session_complete
        ticket_price: null, // Not in session_complete (could derive from financial data)
        ticket_url: event.url ?? null,
        external_ticket_url: event.url ?? null,
        promoter_id: null, // Not applicable for scraped events
        co_promoter_ids: null,
        spots: totalCapacity, // Use capacity as spots
        applied_spots: null, // No internal application system for scraped events
        filled_slots: typeof event.total_ticket_count === 'number' ? event.total_ticket_count : null,
        is_recurring: false,
        is_verified_only: false,
        banner_url: event.banner_image_url ?? null,
        image_url: event.banner_image_url ?? null,
        applications_count: 0, // No applications for scraped events
        available_spots: totalCapacity && typeof event.total_ticket_count === 'number'
          ? Math.max(0, totalCapacity - event.total_ticket_count)
          : null,
        is_full: totalCapacity && typeof event.total_ticket_count === 'number'
          ? event.total_ticket_count >= totalCapacity
          : false,
        is_past: Boolean(event.is_past),
        days_until: typeof event.days_until === 'number' ? event.days_until : null,
        is_favorited: false, // Favorites not supported for scraped events yet
        coordinates,
        waitlist_spots: null,
        confirmed_lineup: null,
        event_spots: null,
        applications: null,
        providerEventIds: null,
        providerSessionIds: null,
        timezone: typeof event.timezone === 'string' ? event.timezone : null,
        // New fields from session_complete
        total_capacity: totalCapacity,
        total_ticket_count: typeof event.total_ticket_count === 'number' ? event.total_ticket_count : null,
        total_order_count: typeof event.total_order_count === 'number' ? event.total_order_count : null,
        total_gross_dollars: typeof event.total_gross_dollars === 'string' ? event.total_gross_dollars : null,
        total_net_dollars: typeof event.total_net_dollars === 'string' ? event.total_net_dollars : null,
      };
    });
  },
};

async function fetchFavoriteEventIds(userId: string | null | undefined) {
  if (!userId) {
    return new Set<string>();
  }

  try {
    const { data, error } = await supabaseClient
      .from('comedian_event_favorites')
      .select('event_id')
      .eq('comedian_id', userId);

    if (error) {
      const code = (error as { code?: string }).code;
      const message = error.message ?? '';

      if (code === '42P01' || message.includes('comedian_event_favorites')) {
        if (import.meta.env.MODE !== 'production') {
          console.info(
            '[eventBrowseService] Favorites table unavailable locally; skipping check.'
          );
        }
        return new Set<string>();
      }

      console.warn(
        '[eventBrowseService] Favorites query failed (ignored):',
        message
      );
      return new Set<string>();
    }

    return new Set<string>(
      (data ?? []).map((row) => row.event_id as string)
    );
  } catch (error) {
    console.warn(
      '[eventBrowseService] Favorites query threw (ignored):',
      (error as Error).message
    );
    return new Set<string>();
  }
}

export type EventBrowseService = typeof eventBrowseService;
