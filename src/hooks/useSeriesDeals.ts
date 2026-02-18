/**
 * useSeriesDeals Hook
 *
 * React Query hook for managing series-level deals.
 * Series deals can be applied to all events in the series or to future events only.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type SeriesDealType = 'revenue_share' | 'fixed_split' | 'tiered' | 'custom';
export type SeriesDealStatus = 'draft' | 'pending_approval' | 'approved' | 'active' | 'cancelled';

export interface SeriesDeal {
  id: string;
  series_id: string;
  title: string;
  deal_type: SeriesDealType | null;
  status: string;
  apply_to_all_events: boolean;
  apply_to_future_only: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeriesDealWithDetails extends SeriesDeal {
  created_by_profile?: {
    id: string;
    name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CreateSeriesDealInput {
  series_id: string;
  title: string;
  deal_type?: SeriesDealType;
  apply_to_all_events?: boolean;
  apply_to_future_only?: boolean;
}

export interface UpdateSeriesDealInput {
  title?: string;
  deal_type?: SeriesDealType;
  status?: SeriesDealStatus;
  apply_to_all_events?: boolean;
  apply_to_future_only?: boolean;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const seriesDealsKeys = {
  all: ['series-deals'] as const,
  bySeries: (seriesId: string) => [...seriesDealsKeys.all, 'series', seriesId] as const,
  detail: (dealId: string) => [...seriesDealsKeys.all, 'detail', dealId] as const,
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

async function getSeriesDeals(seriesId: string): Promise<SeriesDealWithDetails[]> {
  // Fetch deals without profile join (FK points to auth.users, not profiles)
  const { data: dealsData, error: dealsError } = await supabase
    .from('series_deals')
    .select('*')
    .eq('series_id', seriesId)
    .order('created_at', { ascending: false });

  if (dealsError) {
    console.error('Error fetching series deals:', dealsError);
    throw dealsError;
  }

  const deals = dealsData || [];

  // Fetch profile data separately
  const creatorIds = deals
    .map(d => d.created_by)
    .filter((id): id is string => id !== null);

  let profilesMap: Record<string, { id: string; name: string | null; display_name: string | null; avatar_url: string | null }> = {};

  if (creatorIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, display_name, avatar_url')
      .in('id', creatorIds);

    if (profilesData) {
      profilesMap = profilesData.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as typeof profilesMap);
    }
  }

  // Combine data
  return deals.map(deal => ({
    ...deal,
    created_by_profile: deal.created_by ? profilesMap[deal.created_by] || null : null,
  })) as SeriesDealWithDetails[];
}

async function getSeriesDealById(dealId: string): Promise<SeriesDealWithDetails | null> {
  const { data: dealData, error: dealError } = await supabase
    .from('series_deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (dealError) {
    if (dealError.code === 'PGRST116') return null;
    console.error('Error fetching series deal:', dealError);
    throw dealError;
  }

  if (!dealData) return null;

  // Fetch creator profile separately
  let creatorProfile = null;
  if (dealData.created_by) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, name, display_name, avatar_url')
      .eq('id', dealData.created_by)
      .single();
    creatorProfile = profileData;
  }

  return {
    ...dealData,
    created_by_profile: creatorProfile,
  } as SeriesDealWithDetails;
}

async function createSeriesDeal(input: CreateSeriesDealInput): Promise<SeriesDeal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dealData = {
    series_id: input.series_id,
    title: input.title,
    deal_type: input.deal_type || null,
    status: 'draft',
    apply_to_all_events: input.apply_to_all_events ?? true,
    apply_to_future_only: input.apply_to_future_only ?? false,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from('series_deals')
    .insert(dealData)
    .select()
    .single();

  if (error) {
    console.error('Error creating series deal:', error);
    throw error;
  }

  return data as SeriesDeal;
}

async function updateSeriesDeal(
  dealId: string,
  input: UpdateSeriesDealInput
): Promise<SeriesDeal> {
  const { data, error } = await supabase
    .from('series_deals')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)
    .select()
    .single();

  if (error) {
    console.error('Error updating series deal:', error);
    throw error;
  }

  return data as SeriesDeal;
}

async function deleteSeriesDeal(dealId: string): Promise<void> {
  const { error } = await supabase
    .from('series_deals')
    .delete()
    .eq('id', dealId);

  if (error) {
    console.error('Error deleting series deal:', error);
    throw error;
  }
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all deals for a series
 */
export function useSeriesDeals(seriesId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: seriesDealsKeys.bySeries(seriesId || ''),
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID is required');
      return getSeriesDeals(seriesId);
    },
    enabled: !!seriesId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: Error & { code?: string }) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading deals',
          description: 'Failed to load series deals. Please try again.'
        });
      }
    }
  });
}

/**
 * Fetch a single deal by ID
 */
export function useSeriesDeal(dealId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: seriesDealsKeys.detail(dealId || ''),
    queryFn: async () => {
      if (!dealId) throw new Error('Deal ID is required');
      return getSeriesDealById(dealId);
    },
    enabled: !!dealId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: Error & { code?: string }) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
    meta: {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error loading deal',
          description: 'Failed to load deal details. Please try again.'
        });
      }
    }
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new series deal
 */
export function useCreateSeriesDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateSeriesDealInput) => createSeriesDeal(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: seriesDealsKeys.bySeries(data.series_id)
      });
      toast({
        title: 'Deal created',
        description: `"${data.title}" has been created successfully.`
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error creating deal',
        description: error.message || 'Failed to create deal. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Update an existing series deal
 */
export function useUpdateSeriesDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ dealId, input }: { dealId: string; input: UpdateSeriesDealInput }) =>
      updateSeriesDeal(dealId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(seriesDealsKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: seriesDealsKeys.bySeries(data.series_id)
      });
      toast({
        title: 'Deal updated',
        description: 'Deal has been updated successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error updating deal',
        description: error.message || 'Failed to update deal. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Delete a series deal
 */
export function useDeleteSeriesDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ dealId, seriesId }: { dealId: string; seriesId: string }) =>
      deleteSeriesDeal(dealId).then(() => seriesId),
    onSuccess: (seriesId) => {
      queryClient.invalidateQueries({
        queryKey: seriesDealsKeys.bySeries(seriesId)
      });
      toast({
        title: 'Deal deleted',
        description: 'Deal has been deleted successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error deleting deal',
        description: error.message || 'Failed to delete deal. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Apply a series deal to all events (placeholder for future implementation)
 * This would create event-level deals for all events in the series
 */
export function useApplySeriesDealToEvents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dealId, seriesId }: { dealId: string; seriesId: string }) => {
      // TODO: Implement actual deal application logic
      // This would:
      // 1. Get the series deal details
      // 2. Get all events in the series
      // 3. Create event_deals for each event based on the series deal template
      console.log('Applying deal', dealId, 'to series', seriesId);
      return { dealId, seriesId };
    },
    onSuccess: ({ seriesId }) => {
      queryClient.invalidateQueries({
        queryKey: seriesDealsKeys.bySeries(seriesId)
      });
      toast({
        title: 'Deal applied',
        description: 'Deal has been applied to all events in the series.'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error applying deal',
        description: error.message || 'Failed to apply deal to events. Please try again.'
      });
    },
    retry: 1
  });
}
