/**
 * useSeriesPartnerOverrides Hook
 *
 * Manages per-member permission overrides for organization-level series partners.
 * When an org is added as a partner, all team members inherit the org's permissions.
 * This hook allows setting per-member overrides (null = inherit from org).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { seriesPartnersKeys } from '@/hooks/useSeriesPartners';

// ============================================================================
// TYPES
// ============================================================================

export interface MemberOverride {
  id: string;
  series_partner_id: string;
  user_id: string;
  can_view_details: boolean | null;
  can_edit_event: boolean | null;
  can_view_financials: boolean | null;
  can_manage_financials: boolean | null;
  can_receive_crm_data: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MemberOverrideWithProfile extends MemberOverride {
  profile?: {
    id: string;
    name: string | null;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface SetMemberOverrideInput {
  series_partner_id: string;
  user_id: string;
  overrides: {
    can_view_details?: boolean | null;
    can_edit_event?: boolean | null;
    can_view_financials?: boolean | null;
    can_manage_financials?: boolean | null;
    can_receive_crm_data?: boolean | null;
  };
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const overrideKeys = {
  all: ['series-partner-overrides'] as const,
  byPartner: (seriesPartnerId: string) => [...overrideKeys.all, seriesPartnerId] as const,
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

async function getPartnerMemberOverrides(seriesPartnerId: string): Promise<MemberOverrideWithProfile[]> {
  const { data, error } = await supabase
    .from('series_partner_member_overrides')
    .select('*')
    .eq('series_partner_id', seriesPartnerId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching member overrides:', error);
    throw error;
  }

  const overrides = data || [];

  // Fetch profiles for users with overrides
  const userIds = overrides.map(o => o.user_id);
  let profilesMap: Record<string, MemberOverrideWithProfile['profile']> = {};

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, display_name, email, avatar_url')
      .in('id', userIds);

    if (profilesData) {
      profilesMap = profilesData.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as typeof profilesMap);
    }
  }

  return overrides.map(override => ({
    ...override,
    profile: profilesMap[override.user_id] || null,
  })) as MemberOverrideWithProfile[];
}

async function upsertMemberOverride(input: SetMemberOverrideInput): Promise<MemberOverride> {
  const { series_partner_id, user_id, overrides } = input;

  const { data, error } = await supabase
    .from('series_partner_member_overrides')
    .upsert(
      {
        series_partner_id,
        user_id,
        ...overrides,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'series_partner_id,user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting member override:', error);
    throw error;
  }

  return data as MemberOverride;
}

async function removeMemberOverride(seriesPartnerId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('series_partner_member_overrides')
    .delete()
    .eq('series_partner_id', seriesPartnerId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing member override:', error);
    throw error;
  }
}

// ============================================================================
// QUERIES
// ============================================================================

export function usePartnerMemberOverrides(seriesPartnerId: string | undefined) {
  return useQuery({
    queryKey: overrideKeys.byPartner(seriesPartnerId || ''),
    queryFn: async () => {
      if (!seriesPartnerId) throw new Error('Series partner ID is required');
      return getPartnerMemberOverrides(seriesPartnerId);
    },
    enabled: !!seriesPartnerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useSetMemberOverride() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: SetMemberOverrideInput) => upsertMemberOverride(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: overrideKeys.byPartner(data.series_partner_id),
      });
      toast({
        title: 'Override saved',
        description: 'Member permission override has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error saving override',
        description: error.message || 'Failed to save member override.',
      });
    },
  });
}

export function useRemoveMemberOverride() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ seriesPartnerId, userId }: { seriesPartnerId: string; userId: string }) =>
      removeMemberOverride(seriesPartnerId, userId).then(() => seriesPartnerId),
    onSuccess: (seriesPartnerId) => {
      queryClient.invalidateQueries({
        queryKey: overrideKeys.byPartner(seriesPartnerId),
      });
      toast({
        title: 'Override removed',
        description: 'Member will now inherit organization permissions.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error removing override',
        description: error.message || 'Failed to remove member override.',
      });
    },
  });
}
