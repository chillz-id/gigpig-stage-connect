import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Event type for comedian-managed events
 * Similar to OrganizationEvent but for individual comedians
 */
export interface ComedianEvent {
  id: string;
  event_date: string;
  event_name: string;
  event_description?: string | null;
  event_image?: string | null;
  is_published: boolean;
  venue?: { name: string } | null;
  ticket_price?: number | null;
  ticket_link?: string | null;
  source: 'native';
  status?: string;
  role: 'owner' | 'partner';
}

/**
 * Transform native event to ComedianEvent format
 */
function transformNativeEvent(event: any, role: 'owner' | 'partner'): ComedianEvent {
  return {
    id: event.id,
    event_date: event.event_date,
    event_name: event.title || event.name || 'Untitled Event',
    event_description: event.description || event.details,
    event_image: event.banner_url || event.hero_image_url,
    is_published: event.status === 'published',
    venue: event.venue ? { name: event.venue } : null,
    ticket_price: event.ticket_price,
    ticket_link: event.ticket_url,
    source: 'native',
    status: event.status,
    role,
  };
}

/**
 * Fetch events where user is owner or partner, deduplicate and sort
 */
async function fetchUserEvents(userId: string, dateFilter?: { operator: 'gte' | 'lt'; value: string }, statusFilter?: string) {
  // Fetch events where user is owner (promoter_id)
  let ownedQuery = supabase
    .from('events')
    .select('*')
    .eq('promoter_id', userId);

  if (dateFilter) {
    ownedQuery = dateFilter.operator === 'gte'
      ? ownedQuery.gte('event_date', dateFilter.value)
      : ownedQuery.lt('event_date', dateFilter.value);
  }

  if (statusFilter) {
    ownedQuery = ownedQuery.eq('status', statusFilter);
  } else {
    // Exclude drafts from non-draft queries
    ownedQuery = ownedQuery.neq('status', 'draft');
  }

  const { data: ownedEvents, error: ownedError } = await ownedQuery;

  if (ownedError) {
    console.error('Error fetching owned events:', ownedError);
  }

  // Fetch events where user is partner (via event_partners)
  const { data: partnerEvents, error: partnerError } = await supabase
    .from('event_partners')
    .select(`
      event_id,
      events!inner (*)
    `)
    .eq('partner_profile_id', userId)
    .eq('status', 'active');

  if (partnerError) {
    console.error('Error fetching partner events:', partnerError);
  }

  // Transform owned events
  const owned = (ownedEvents || []).map((e) => transformNativeEvent(e, 'owner'));

  // Transform partner events (filter by date/status in memory since join doesn't support it easily)
  let partnered = (partnerEvents || [])
    .map((p: any) => transformNativeEvent(p.events, 'partner'))
    .filter((e) => {
      if (dateFilter) {
        const eventDate = new Date(e.event_date);
        const filterDate = new Date(dateFilter.value);
        if (dateFilter.operator === 'gte' && eventDate < filterDate) return false;
        if (dateFilter.operator === 'lt' && eventDate >= filterDate) return false;
      }
      if (statusFilter && e.status !== statusFilter) return false;
      if (!statusFilter && e.status === 'draft') return false;
      return true;
    });

  // Combine and deduplicate (owned takes precedence)
  const ownedIds = new Set(owned.map((e) => e.id));
  partnered = partnered.filter((e) => !ownedIds.has(e.id));

  return [...owned, ...partnered];
}

/**
 * Hook to fetch all events where user is owner or partner
 */
export const useComedianEvents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comedian-events', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      const events = await fetchUserEvents(user.id);
      return events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to fetch upcoming events where user is owner or partner
 */
export const useComedianUpcomingEvents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comedian-upcoming-events', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      const now = new Date().toISOString();
      const events = await fetchUserEvents(user.id, { operator: 'gte', value: now });
      return events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to fetch past events where user is owner or partner
 */
export const useComedianPastEvents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comedian-past-events', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      const now = new Date().toISOString();
      const events = await fetchUserEvents(user.id, { operator: 'lt', value: now });
      return events.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to fetch draft events created by the current user
 * Note: Only owners can have drafts (partners wouldn't see drafts)
 */
export const useComedianDraftEvents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comedian-draft-events', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      // Drafts are only for owned events
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('promoter_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching comedian draft events:', error);
        throw error;
      }

      return (events || []).map((e) => transformNativeEvent(e, 'owner'));
    },
    enabled: !!user?.id,
  });
};
