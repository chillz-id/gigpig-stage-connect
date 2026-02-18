/**
 * useSeriesPartners Hook
 *
 * React Query hook for managing series-level partners.
 * Partners added at the series level are automatically synced to all events
 * in the series with partner_type = 'series_inherited'.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type SeriesPartnerType = 'manual' | 'deal_participant' | 'co_promoter';
export type SeriesPartnerStatus = 'pending_invite' | 'active' | 'inactive';

export interface SeriesPartnerPermissions {
  is_admin: boolean;
  can_view_details: boolean;
  can_edit_event: boolean;
  can_view_financials: boolean;
  can_manage_financials: boolean;
  can_receive_crm_data: boolean;
}

export interface SeriesPartner {
  id: string;
  series_id: string;
  partner_profile_id: string | null;
  partner_type: SeriesPartnerType;
  is_admin: boolean;
  can_view_details: boolean;
  can_edit_event: boolean;
  can_view_financials: boolean;
  can_manage_financials: boolean;
  can_receive_crm_data: boolean;
  status: SeriesPartnerStatus;
  invited_email: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeriesPartnerWithProfile extends SeriesPartner {
  partner_profile?: {
    id: string;
    name: string | null;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  added_by_profile?: {
    id: string;
    name: string | null;
    display_name: string | null;
  } | null;
}

export interface AddSeriesPartnerInput {
  series_id: string;
  partner_profile_id?: string;
  invited_email?: string;
  permissions?: Partial<SeriesPartnerPermissions>;
}

export interface UpdateSeriesPartnerPermissionsInput {
  partner_id: string;
  permissions: Partial<SeriesPartnerPermissions>;
}

// ============================================================================
// DEFAULT PERMISSIONS
// ============================================================================

export const DEFAULT_SERIES_PARTNER_PERMISSIONS: SeriesPartnerPermissions = {
  is_admin: false,
  can_view_details: true,
  can_edit_event: false,
  can_view_financials: false,
  can_manage_financials: false,
  can_receive_crm_data: false,
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const seriesPartnersKeys = {
  all: ['series-partners'] as const,
  bySeries: (seriesId: string) => [...seriesPartnersKeys.all, 'series', seriesId] as const,
  detail: (partnerId: string) => [...seriesPartnersKeys.all, 'detail', partnerId] as const,
  search: (seriesId: string, query: string) => [...seriesPartnersKeys.all, 'search', seriesId, query] as const
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

async function getSeriesPartners(seriesId: string): Promise<SeriesPartnerWithProfile[]> {
  // Fetch partners without profile join (FK points to auth.users, not profiles)
  const { data: partnersData, error: partnersError } = await supabase
    .from('series_partners')
    .select('*')
    .eq('series_id', seriesId)
    .order('created_at', { ascending: true });

  if (partnersError) {
    console.error('Error fetching series partners:', partnersError);
    throw partnersError;
  }

  const partners = partnersData || [];

  // Fetch profile data separately for partners with profile IDs
  const profileIds = partners
    .map(p => p.partner_profile_id)
    .filter((id): id is string => id !== null);

  let profilesMap: Record<string, { id: string; name: string | null; display_name: string | null; email: string | null; avatar_url: string | null }> = {};

  if (profileIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, display_name, email, avatar_url')
      .in('id', profileIds);

    if (profilesData) {
      profilesMap = profilesData.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as typeof profilesMap);
    }
  }

  // Combine data
  return partners.map(partner => ({
    ...partner,
    partner_profile: partner.partner_profile_id ? profilesMap[partner.partner_profile_id] || null : null,
    added_by_profile: null, // Skip added_by profile for simplicity
  })) as SeriesPartnerWithProfile[];
}

async function addSeriesPartner(input: AddSeriesPartnerInput): Promise<SeriesPartner> {
  const { series_id, partner_profile_id, invited_email, permissions = {} } = input;

  if (!partner_profile_id && !invited_email) {
    throw new Error('Either partner_profile_id or invited_email is required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const partnerData = {
    series_id,
    partner_profile_id: partner_profile_id || null,
    invited_email: partner_profile_id ? null : invited_email,
    partner_type: 'manual' as SeriesPartnerType,
    status: partner_profile_id ? 'active' : 'pending_invite' as SeriesPartnerStatus,
    added_by: user.id,
    ...DEFAULT_SERIES_PARTNER_PERMISSIONS,
    ...permissions,
  };

  const { data, error } = await supabase
    .from('series_partners')
    .insert(partnerData)
    .select()
    .single();

  if (error) {
    console.error('Error adding series partner:', error);
    throw error;
  }

  return data as SeriesPartner;
}

async function updateSeriesPartnerPermissions(
  input: UpdateSeriesPartnerPermissionsInput
): Promise<SeriesPartner> {
  const { partner_id, permissions } = input;

  const { data, error } = await supabase
    .from('series_partners')
    .update({
      ...permissions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', partner_id)
    .select()
    .single();

  if (error) {
    console.error('Error updating series partner permissions:', error);
    throw error;
  }

  return data as SeriesPartner;
}

async function removeSeriesPartner(partnerId: string): Promise<void> {
  const { error } = await supabase
    .from('series_partners')
    .delete()
    .eq('id', partnerId);

  if (error) {
    console.error('Error removing series partner:', error);
    throw error;
  }
}

async function deactivateSeriesPartner(partnerId: string): Promise<SeriesPartner> {
  const { data, error } = await supabase
    .from('series_partners')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId)
    .select()
    .single();

  if (error) {
    console.error('Error deactivating series partner:', error);
    throw error;
  }

  return data as SeriesPartner;
}

async function reactivateSeriesPartner(partnerId: string): Promise<SeriesPartner> {
  const { data, error } = await supabase
    .from('series_partners')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId)
    .select()
    .single();

  if (error) {
    console.error('Error reactivating series partner:', error);
    throw error;
  }

  return data as SeriesPartner;
}

async function searchProfilesToAddToSeries(
  query: string,
  seriesId: string
): Promise<{
  id: string;
  name: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}[]> {
  // Get existing partner profile IDs to exclude
  const { data: existingPartners } = await supabase
    .from('series_partners')
    .select('partner_profile_id')
    .eq('series_id', seriesId)
    .not('partner_profile_id', 'is', null);

  const existingIds = (existingPartners || [])
    .map(p => p.partner_profile_id)
    .filter(Boolean);

  // Search profiles
  let profileQuery = supabase
    .from('profiles')
    .select('id, name, display_name, email, avatar_url')
    .or(`name.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  if (existingIds.length > 0) {
    profileQuery = profileQuery.not('id', 'in', `(${existingIds.join(',')})`);
  }

  const { data, error } = await profileQuery;

  if (error) {
    console.error('Error searching profiles:', error);
    throw error;
  }

  return data || [];
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all partners for a series
 */
export function useSeriesPartners(seriesId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: seriesPartnersKeys.bySeries(seriesId || ''),
    queryFn: async () => {
      if (!seriesId) throw new Error('Series ID is required');
      return getSeriesPartners(seriesId);
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
          title: 'Error loading partners',
          description: 'Failed to load series partners. Please try again.'
        });
      }
    }
  });
}

/**
 * Search for profiles to add as partners
 */
export function useSearchSeriesPartnersToAdd(seriesId: string | undefined, query: string) {
  return useQuery({
    queryKey: seriesPartnersKeys.search(seriesId || '', query),
    queryFn: async () => {
      if (!seriesId || !query || query.length < 2) return [];
      return searchProfilesToAddToSeries(query, seriesId);
    },
    enabled: !!seriesId && query.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add a new partner to a series
 */
export function useAddSeriesPartner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: AddSeriesPartnerInput) => addSeriesPartner(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: seriesPartnersKeys.bySeries(data.series_id)
      });
      toast({
        title: 'Partner added',
        description: data.status === 'pending_invite'
          ? 'Partner invitation has been sent.'
          : 'Partner has been added to the series and all its events.'
      });
    },
    onError: (error: Error & { code?: string }) => {
      if (error?.code === '23505') {
        toast({
          variant: 'destructive',
          title: 'Partner already exists',
          description: 'This user is already a partner on this series.'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error adding partner',
          description: error.message || 'Failed to add partner. Please try again.'
        });
      }
    },
    retry: 1
  });
}

/**
 * Update series partner permissions
 */
export function useUpdateSeriesPartnerPermissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: UpdateSeriesPartnerPermissionsInput) =>
      updateSeriesPartnerPermissions(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: seriesPartnersKeys.bySeries(data.series_id)
      });
      toast({
        title: 'Permissions updated',
        description: 'Partner permissions have been updated for the series and all its events.'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error updating permissions',
        description: error.message || 'Failed to update permissions. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Remove a partner from a series
 */
export function useRemoveSeriesPartner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ partnerId, seriesId }: { partnerId: string; seriesId: string }) =>
      removeSeriesPartner(partnerId).then(() => seriesId),
    onSuccess: (seriesId) => {
      queryClient.invalidateQueries({
        queryKey: seriesPartnersKeys.bySeries(seriesId)
      });
      toast({
        title: 'Partner removed',
        description: 'Partner has been removed from the series and all its events.'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error removing partner',
        description: error.message || 'Failed to remove partner. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Deactivate a series partner
 */
export function useDeactivateSeriesPartner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ partnerId, seriesId }: { partnerId: string; seriesId: string }) =>
      deactivateSeriesPartner(partnerId).then((data) => ({ ...data, seriesId })),
    onSuccess: ({ seriesId }) => {
      queryClient.invalidateQueries({
        queryKey: seriesPartnersKeys.bySeries(seriesId)
      });
      toast({
        title: 'Partner deactivated',
        description: 'Partner access has been deactivated for the series.'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error deactivating partner',
        description: error.message || 'Failed to deactivate partner. Please try again.'
      });
    },
    retry: 1
  });
}

/**
 * Reactivate a series partner
 */
export function useReactivateSeriesPartner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ partnerId, seriesId }: { partnerId: string; seriesId: string }) =>
      reactivateSeriesPartner(partnerId).then((data) => ({ ...data, seriesId })),
    onSuccess: ({ seriesId }) => {
      queryClient.invalidateQueries({
        queryKey: seriesPartnersKeys.bySeries(seriesId)
      });
      toast({
        title: 'Partner reactivated',
        description: 'Partner access has been restored for the series.'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error reactivating partner',
        description: error.message || 'Failed to reactivate partner. Please try again.'
      });
    },
    retry: 1
  });
}
