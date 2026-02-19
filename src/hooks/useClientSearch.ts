/**
 * useClientSearch - Search across profile tables for invoice clients
 *
 * Searches: profiles, organization_profiles, comedians (directory_profiles),
 * photographer_profiles, videographer_profiles, manager_profiles, directory_profiles
 *
 * Returns unified InvoiceClient[] for use in ClientSelector
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ClientType =
  | 'comedian'
  | 'photographer'
  | 'videographer'
  | 'manager'
  | 'organization'
  | 'venue'
  | 'profile'
  | 'custom';

export interface InvoiceClient {
  id: string;
  type: ClientType;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  abn: string | null;
  gstRegistered: boolean;
  // Additional metadata for display
  avatarUrl?: string | null;
  subtitle?: string | null; // e.g., "Sydney, Australia" or "Photography"
}

interface UseClientSearchOptions {
  debounceMs?: number;
  limit?: number;
}

interface SearchResults {
  clients: InvoiceClient[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Search across all profile tables for potential invoice clients
 * Note: Queries only select columns that exist in all environments.
 * New columns (phone, address, abn, gst_registered) added via migration may not exist yet.
 */
async function searchClients(query: string, limit: number): Promise<InvoiceClient[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const results: InvoiceClient[] = [];

  // Search directory_profiles (includes comedians, photographers, etc.)
  try {
    const { data: directoryProfiles, error } = await supabase
      .from('directory_profiles')
      .select('id, stage_name, email, primary_headshot_url, origin_city, profile_type')
      .filter('stage_name', 'ilike', `%${query}%`)
      .limit(limit);

    console.log('Directory profiles search:', { query, count: directoryProfiles?.length, error });

    if (!error && directoryProfiles) {
      directoryProfiles.forEach(profile => {
        results.push({
          id: profile.id,
          type: (profile.profile_type as ClientType) || 'comedian',
          name: profile.stage_name,
          email: profile.email,
          phone: null,
          address: null,
          abn: null,
          gstRegistered: false,
          avatarUrl: profile.primary_headshot_url,
          subtitle: profile.origin_city || profile.profile_type || undefined,
        });
      });
    }
  } catch (e) {
    console.warn('Error searching directory_profiles:', e);
  }

  // Search profiles (authenticated users)
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, location')
      .filter('full_name', 'ilike', `%${query}%`)
      .limit(limit);

    if (!error && profiles) {
      profiles.forEach(profile => {
        // Avoid duplicates by checking if email already exists
        if (!results.some(r => r.email === profile.email)) {
          results.push({
            id: profile.id,
            type: 'profile',
            name: profile.full_name || 'Unknown',
            email: profile.email,
            phone: null,
            address: null,
            abn: null,
            gstRegistered: false,
            avatarUrl: profile.avatar_url,
            subtitle: profile.location || undefined,
          });
        }
      });
    }
  } catch (e) {
    console.warn('Error searching profiles:', e);
  }

  // Search organization_profiles (has ABN, GST, etc.)
  try {
    console.log('Searching organization_profiles with query:', query);
    const { data: orgProfiles, error } = await supabase
      .from('organization_profiles')
      .select('id, organization_name, contact_email, contact_phone, address, city, state, logo_url, abn, gst_registered')
      .ilike('organization_name', `%${query}%`)
      .limit(limit);

    console.log('Organization profiles search result:', { query, count: orgProfiles?.length, orgProfiles, error });

    if (!error && orgProfiles) {
      orgProfiles.forEach(org => {
        const fullAddress = [org.address, org.city, org.state].filter(Boolean).join(', ') || null;
        results.push({
          id: org.id,
          type: 'organization',
          name: org.organization_name,
          email: org.contact_email,
          phone: org.contact_phone,
          address: fullAddress,
          abn: org.abn,
          gstRegistered: org.gst_registered ?? false,
          avatarUrl: org.logo_url,
          subtitle: org.state || 'Organization',
        });
      });
    }
  } catch (e) {
    console.warn('Error searching organization_profiles:', e);
  }

  // Search venues
  try {
    const { data: venues, error } = await supabase
      .from('venues')
      .select('id, name, email, formatted_address')
      .filter('name', 'ilike', `%${query}%`)
      .limit(limit);

    if (!error && venues) {
      venues.forEach(venue => {
        results.push({
          id: venue.id,
          type: 'venue',
          name: venue.name,
          email: venue.email,
          phone: null,
          address: venue.formatted_address,
          abn: null,
          gstRegistered: false,
          avatarUrl: null,
          subtitle: 'Venue',
        });
      });
    }
  } catch (e) {
    console.warn('Error searching venues:', e);
  }

  // Deduplicate by email (keeping first match)
  const seen = new Set<string>();
  const uniqueResults = results.filter(client => {
    if (!client.email) return true; // Keep clients without email
    if (seen.has(client.email)) return false;
    seen.add(client.email);
    return true;
  });

  return uniqueResults.slice(0, limit);
}

/**
 * Hook for searching clients across profile tables
 */
export function useClientSearch(options: UseClientSearchOptions = {}) {
  const { limit = 20 } = options;
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['client-search', searchQuery, limit],
    queryFn: () => searchClients(searchQuery, limit),
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // 30 seconds
  });

  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    clients,
    isLoading,
    error: error as Error | null,
    search,
    clearSearch,
    searchQuery,
  };
}

/**
 * Fetch a single client by ID and type
 * Note: Only selects columns that exist in all environments.
 */
export async function getClientById(id: string, type: ClientType): Promise<InvoiceClient | null> {
  switch (type) {
    case 'directory':
    case 'comedian':
    case 'photographer':
    case 'videographer':
    case 'manager': {
      const { data } = await supabase
        .from('directory_profiles')
        .select('id, stage_name, email, primary_headshot_url, origin_city, profile_type')
        .eq('id', id)
        .single();

      if (!data) return null;
      return {
        id: data.id,
        type: (data.profile_type as ClientType) || type,
        name: data.stage_name,
        email: data.email,
        phone: null,
        address: null,
        abn: null,
        gstRegistered: false,
        avatarUrl: data.primary_headshot_url,
        subtitle: data.origin_city,
      };
    }

    case 'organization': {
      // Try organization_profiles first (has ABN, GST info)
      const { data: orgProfile } = await supabase
        .from('organization_profiles')
        .select('id, organization_name, contact_email, contact_phone, address, city, state, logo_url, abn, gst_registered')
        .eq('id', id)
        .single();

      if (!orgProfile) return null;

      const fullAddress = [orgProfile.address, orgProfile.city, orgProfile.state].filter(Boolean).join(', ') || null;
      return {
        id: orgProfile.id,
        type: 'organization',
        name: orgProfile.organization_name,
        email: orgProfile.contact_email,
        phone: orgProfile.contact_phone,
        address: fullAddress,
        abn: orgProfile.abn,
        gstRegistered: orgProfile.gst_registered ?? false,
        avatarUrl: orgProfile.logo_url,
        subtitle: orgProfile.state || 'Organization',
      };
    }

    case 'venue': {
      const { data } = await supabase
        .from('venues')
        .select('id, name, email, formatted_address')
        .eq('id', id)
        .single();

      if (!data) return null;
      return {
        id: data.id,
        type: 'venue',
        name: data.name,
        email: data.email,
        phone: null,
        address: data.formatted_address,
        abn: null,
        gstRegistered: false,
        avatarUrl: null,
        subtitle: 'Venue',
      };
    }

    case 'profile': {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, location')
        .eq('id', id)
        .single();

      if (!data) return null;
      return {
        id: data.id,
        type: 'profile',
        name: data.full_name || 'Unknown',
        email: data.email,
        phone: null,
        address: null,
        abn: null,
        gstRegistered: false,
        avatarUrl: data.avatar_url,
        subtitle: data.location,
      };
    }

    default:
      return null;
  }
}

export default useClientSearch;
