import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import type { ManagerType, OrganizationPermissions } from '@/types/permissions';

// Stable empty object to prevent infinite loops from new object references
const EMPTY_ORGANIZATIONS: Record<string, OrganizationProfile> = {};

export interface OrganizationProfile {
  id: string;
  display_name: string;
  legal_name: string;
  display_name_preference: 'display' | 'legal';
  organization_name: string;
  organization_type: string;
  custom_organization_type?: string;
  owner_id: string;
  is_owner: boolean;
  member_role: string;
  manager_type?: ManagerType | null;
  custom_permissions?: OrganizationPermissions | null;
  logo_url?: string;
  bio?: string;
  contact_email: string;
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  url_slug?: string;
}

/**
 * Hook to fetch all organizations a user owns or is a member of
 *
 * Returns a map of organization ID -> organization data for easy lookup
 */
export function useOrganizationProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['organization-profiles', user?.id],
    queryFn: async () => {
      console.log('[useOrganizationProfiles] Fetching organizations for user:', user?.id);
      if (!user) return EMPTY_ORGANIZATIONS;

      // Use the database function to get user's organizations
      const { data: organizations, error } = await supabase
        .rpc('get_user_organizations', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching organizations:', error);
        // Return empty object instead of throwing - allows base profiles to work
        return EMPTY_ORGANIZATIONS;
      }

      // Fetch full organization details for each org
      const orgIds = organizations?.map((org: { org_id: string }) => org.org_id) || [];

      if (orgIds.length === 0) {
        return EMPTY_ORGANIZATIONS;
      }

      const { data: orgProfiles, error: profilesError } = await supabase
        .from('organization_profiles')
        .select('*')
        .in('id', orgIds);

      if (profilesError) {
        console.error('Error fetching organization profiles:', profilesError);
        // Return empty object instead of throwing - allows base profiles to work
        return EMPTY_ORGANIZATIONS;
      }

      // Create a map of org_id -> org data with membership info
      const orgMap: Record<string, OrganizationProfile> = {};

      orgProfiles?.forEach((profile) => {
        const membership = organizations?.find((org: { org_id: string }) => org.org_id === profile.id);

        orgMap[profile.id] = {
          id: profile.id,
          display_name: profile.display_name,
          legal_name: profile.legal_name,
          display_name_preference: (profile.display_name_preference as 'display' | 'legal') || 'display',
          organization_name: profile.organization_name,
          organization_type: profile.organization_type,
          custom_organization_type: profile.custom_organization_type,
          owner_id: profile.owner_id,
          is_owner: membership?.is_owner || false,
          member_role: membership?.member_role || 'member',
          manager_type: membership?.manager_type || null,
          custom_permissions: membership?.custom_permissions || null,
          logo_url: profile.logo_url,
          bio: profile.bio,
          contact_email: profile.contact_email,
          website_url: profile.website_url,
          instagram_url: profile.instagram_url,
          facebook_url: profile.facebook_url,
          twitter_url: profile.twitter_url,
          tiktok_url: profile.tiktok_url,
          url_slug: profile.url_slug,
        };
      });

      console.log('[useOrganizationProfiles] Organizations fetched:', Object.keys(orgMap).length);
      return orgMap;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // CRITICAL: Prevent refetch on window focus
    refetchOnMount: false, // CRITICAL: Don't refetch on every mount
    refetchOnReconnect: true, // Only refetch on network reconnect
  });
}

/**
 * Helper to get the display name for an organization
 * based on its display_name_preference
 */
export function getOrganizationDisplayName(org: OrganizationProfile): string {
  return org.display_name_preference === 'legal'
    ? org.legal_name
    : org.display_name;
}

/**
 * Hook to update organization profile
 *
 * Updates the organization_profiles table and invalidates the cache
 */
export function useUpdateOrganizationProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: {
      organization_name?: string;
      organization_type?: string;
      bio?: string;
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      suburb?: string;
      postcode?: string;
      state?: string;
      country?: string;
      social_links?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        tiktok?: string;
      };
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the current organization ID from the context
      // For now, we'll need to pass the org ID or get it from URL params
      // This is a simplified version - you may need to adjust based on your setup
      const orgId = window.location.pathname.split('/org/')[1]?.split('/')[0];

      if (!orgId) {
        throw new Error('Organization ID not found');
      }

      const { data, error } = await supabase
        .from('organization_profiles')
        .update({
          organization_name: updates.organization_name,
          organization_type: updates.organization_type,
          bio: updates.bio,
          contact_email: updates.email,
          website_url: updates.website,
          instagram_url: updates.social_links?.instagram,
          facebook_url: updates.social_links?.facebook,
          twitter_url: updates.social_links?.twitter,
          tiktok_url: updates.social_links?.tiktok,
        })
        .eq('id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error updating organization profile:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profiles', user?.id] });
      toast({
        title: 'Profile updated',
        description: 'Organization profile has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export interface OrganizationTeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  manager_type?: ManagerType | null;
  custom_permissions?: OrganizationPermissions | null;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  // Flattened user properties for easier access
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
}

/**
 * Hook to fetch all team members for an organization
 *
 * @param orgId - The organization ID to fetch team members for
 */
export function useOrganizationTeamMembers(orgId: string) {
  return useQuery({
    queryKey: ['organization-team-members', orgId],
    queryFn: async () => {
      if (!orgId) {
        return [];
      }

      // First, get the organization's owner_id
      const { data: orgData, error: orgError } = await supabase
        .from('organization_profiles')
        .select('owner_id')
        .eq('id', orgId)
        .single();

      if (orgError) {
        console.error('Error fetching organization owner:', orgError);
        throw orgError;
      }

      const ownerId = orgData?.owner_id;

      // Then fetch team members with user profile data
      const { data, error } = await supabase
        .from('organization_team_members')
        .select(`
          *,
          user:user_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      // Transform data to flatten user properties and compute is_owner
      const transformedData: OrganizationTeamMember[] = (data || []).map((member) => {
        const user = member.user as { id: string; first_name?: string; last_name?: string; email?: string; avatar_url?: string } | null;
        return {
          id: member.id,
          organization_id: member.organization_id,
          user_id: member.user_id,
          role: member.role,
          manager_type: member.manager_type,
          custom_permissions: member.custom_permissions,
          created_at: member.joined_at || member.created_at,
          updated_at: member.joined_at || member.created_at,
          is_owner: member.user_id === ownerId,
          // Flatten user properties
          first_name: user?.first_name,
          last_name: user?.last_name,
          email: user?.email,
          avatar_url: user?.avatar_url,
        };
      });

      return transformedData;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to update a team member's role and permissions
 */
export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      memberId,
      orgId,
      role,
      managerType,
      customPermissions,
    }: {
      memberId: string;
      orgId: string;
      role?: string;
      managerType?: ManagerType | null;
      customPermissions?: OrganizationPermissions | null;
    }) => {
      const updates: {
        role?: string;
        manager_type?: ManagerType | null;
        custom_permissions?: OrganizationPermissions | null;
      } = {};

      if (role !== undefined) updates.role = role;
      if (managerType !== undefined) updates.manager_type = managerType;
      if (customPermissions !== undefined) updates.custom_permissions = customPermissions;

      const { data, error } = await supabase
        .from('organization_team_members')
        .update(updates)
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error updating team member:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-team-members', variables.orgId] });
      toast({
        title: 'Team member updated',
        description: 'Team member role and permissions have been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating team member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to remove a team member from an organization
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      memberId,
      orgId,
    }: {
      memberId: string;
      orgId: string;
    }) => {
      const { error } = await supabase
        .from('organization_team_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', orgId);

      if (error) {
        console.error('Error removing team member:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-team-members', variables.orgId] });
      toast({
        title: 'Team member removed',
        description: 'Team member has been removed from the organization.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing team member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to create a new organization
 *
 * Creates both profile and organization_profiles records
 * with proper cache invalidation
 */
export function useCreateOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      organization_name: string;
      display_name: string;
      legal_name: string;
      display_name_preference: 'display' | 'legal';
      organization_type: string;
      abn?: string;
      bio?: string;
      contact_email: string;
      contact_phone?: string;
      website_url?: string;
      instagram_url?: string;
      facebook_url?: string;
      twitter_url?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Step 1: Create profile record for organization
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: data.contact_email,
          name: data.organization_name,
          display_name: data.display_name,
          bio: data.bio,
          website_url: data.website_url,
          instagram_url: data.instagram_url,
          facebook_url: data.facebook_url,
          twitter_url: data.twitter_url,
          abn: data.abn,
        })
        .select()
        .single();

      if (profileError) throw profileError;
      if (!newProfile) throw new Error('Failed to create organization profile');

      // Step 2: Create organization_profiles record
      const { data: org, error: orgError } = await supabase
        .from('organization_profiles')
        .insert({
          id: newProfile.id,
          owner_id: user.id,
          ...data,
        })
        .select()
        .single();

      if (orgError) {
        // Rollback: delete the profile if organization creation fails
        await supabase.from('profiles').delete().eq('id', newProfile.id);
        throw orgError;
      }

      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profiles', user?.id] });
      toast({
        title: 'Organization created',
        description: 'Your organization has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating organization',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to delete an organization
 *
 * Deletes the organization and invalidates caches
 */
export function useDeleteOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orgId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Delete organization (CASCADE will handle team members)
      const { error: orgError } = await supabase
        .from('organization_profiles')
        .delete()
        .eq('id', orgId);

      if (orgError) throw orgError;

      // Delete the profile record (CASCADE should handle this, but explicit is safer)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', orgId);

      if (profileError) {
        console.error('Profile deletion error (may be expected if CASCADE handled it):', profileError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profiles', user?.id] });
      toast({
        title: 'Organization deleted',
        description: 'Organization has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting organization',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
