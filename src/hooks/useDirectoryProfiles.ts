/**
 * Hook for searching and managing directory profiles
 * Used for adding unclaimed profiles to lineups
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DirectoryProfileSearchResult {
  id: string;
  stage_name: string;
  primary_headshot_url: string | null;
  short_bio: string | null;
  origin_city: string | null;
  tags: string[] | null;
  claimed_at: string | null;
  photo_count: number;
  slug: string | null;
  email: string | null;
  created_at: string | null;
}

interface UseDirectoryProfilesOptions {
  query?: string;
  tags?: string[];
  unclaimedOnly?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Search directory profiles using the search_directory_profiles RPC function
 */
export function useDirectoryProfiles({
  query = '',
  tags = [],
  unclaimedOnly = true,
  limit = 20,
  offset = 0,
  enabled = true,
}: UseDirectoryProfilesOptions = {}) {
  return useQuery({
    queryKey: ['directory-profiles', query, tags, unclaimedOnly, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_directory_profiles', {
        p_query: query || null,
        p_tags: tags.length > 0 ? tags : null,
        p_unclaimed_only: unclaimedOnly,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) throw error;
      return (data || []) as DirectoryProfileSearchResult[];
    },
    enabled,
  });
}

/**
 * Get a single directory profile by ID
 */
export function useDirectoryProfile(profileId: string | null) {
  return useQuery({
    queryKey: ['directory-profile', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('directory_profiles')
        .select(`
          id,
          stage_name,
          primary_headshot_url,
          short_bio,
          origin_city,
          tags,
          claimed_at,
          slug,
          email
        `)
        .eq('id', profileId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
}
