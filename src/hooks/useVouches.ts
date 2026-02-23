import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vouch, VouchWithProfiles, VouchFormData, VouchStats, UserSearchResult } from '@/types/vouch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useVouches = (profileId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  const [loading, setLoading] = useState(false);
  const [vouches, setVouches] = useState<VouchWithProfiles[]>([]);
  const [stats, setStats] = useState<VouchStats | null>(null);

  // Use provided profileId or fall back to authenticated user's ID
  const activeProfileId = profileId || user?.id;

  // Fetch vouches for current profile
  const fetchVouches = useCallback(async () => {
    if (!activeProfileId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_vouches_with_profiles', { user_id_param: activeProfileId });

      if (error) throw error;
      // Empty array is a valid state, not an error
      setVouches(data || []);
    } catch (error) {
      console.error('Error fetching vouches:', error);
      // Only show error toast if there's an actual error, not just empty results
      toastRef.current({
        title: "Error",
        description: "Failed to load vouches",
        variant: "destructive",
      });
      // Set empty array on error to prevent undefined state
      setVouches([]);
    } finally {
      setLoading(false);
    }
  }, [activeProfileId]);

  // Fetch vouch statistics
  const fetchStats = useCallback(async () => {
    if (!activeProfileId) return;

    try {
      const { data, error } = await supabase
        .rpc('get_vouch_stats', { user_id_param: activeProfileId });

      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching vouch stats:', error);
    }
  }, [activeProfileId]);

  // Search for users and organizations to vouch for
  const searchUsers = useCallback(async (query: string): Promise<UserSearchResult[]> => {
    if (!query.trim() || !activeProfileId) return [];

    try {
      const results: UserSearchResult[] = [];
      const seenIds = new Set<string>();

      // 1. Search profiles by name
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, stage_name, avatar_url')
        .neq('id', activeProfileId)
        .ilike('name', `%${query}%`)
        .limit(10);

      if (profileError) {
        console.error('Profile search error:', profileError);
      } else {
        for (const p of profileData || []) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            // Get roles for this profile
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', p.id);
            results.push({
              id: p.id,
              name: p.name || '',
              stage_name: p.stage_name,
              avatar_url: p.avatar_url,
              roles: roles?.map(r => r.role) || []
            });
          }
        }
      }

      // 2. Search comedians by stage_name
      const { data: comedianData, error: comedianError } = await supabase
        .from('comedians')
        .select('id, stage_name, headshot_url')
        .neq('id', activeProfileId)
        .ilike('stage_name', `%${query}%`)
        .limit(5);

      if (comedianError) {
        console.error('Comedian search error:', comedianError);
      } else {
        for (const c of comedianData || []) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            // Get profile info
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', c.id)
              .single();
            results.push({
              id: c.id,
              name: profile?.name || c.stage_name || '',
              stage_name: c.stage_name,
              avatar_url: c.headshot_url || profile?.avatar_url,
              roles: ['comedian']
            });
          }
        }
      }

      // 3. Search organizations by name
      const { data: orgData, error: orgError } = await supabase
        .from('organization_profiles')
        .select('id, organization_name')
        .neq('id', activeProfileId)
        .ilike('organization_name', `%${query}%`)
        .limit(5);

      if (orgError) {
        console.error('Org search error:', orgError);
      } else {
        for (const o of orgData || []) {
          if (!seenIds.has(o.id)) {
            seenIds.add(o.id);
            // Get profile avatar
            const { data: profile } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', o.id)
              .single();
            results.push({
              id: o.id,
              name: o.organization_name || '',
              stage_name: o.organization_name,
              avatar_url: profile?.avatar_url,
              roles: ['organization']
            });
          }
        }
      }

      return results.slice(0, 10);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }, [activeProfileId]);

  // Check if vouch already exists between two profiles
  const checkExistingVouch = useCallback(async (voucheeId: string): Promise<Vouch | null> => {
    if (!activeProfileId) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_existing_vouch', {
          giver_id: activeProfileId,
          receiver_id: voucheeId
        });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error checking existing vouch:', error);
      return null;
    }
  }, [activeProfileId]);

  // Create a new vouch
  const createVouch = async (formData: VouchFormData) => {
    if (!user?.id) throw new Error('User not authenticated');
    if (!activeProfileId) throw new Error('Profile not found');

    try {
      // Check if vouch already exists
      const existing = await checkExistingVouch(formData.vouchee_id);
      if (existing) {
        throw new Error('You have already vouched for this person. You can edit your existing vouch instead.');
      }

      const insertPayload = {
        voucher_id: user.id, // Always use auth user ID (RLS requires auth.uid() = voucher_id)
        vouchee_id: formData.vouchee_id,
        message: formData.message,
        rating: formData.rating,
        organization_id: formData.organization_id || null // When set, vouch displays as org
      };

      console.log('[useVouches] Creating vouch with payload:', {
        ...insertPayload,
        activeProfileId,
        'auth user.id': user.id,
        'RLS expects': 'auth.uid() = voucher_id'
      });

      const { data, error } = await supabase
        .from('vouches')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error('[useVouches] Vouch insert error:', error);
        throw error;
      }

      toastRef.current({
        title: "Vouch Created",
        description: "Your vouch has been successfully submitted.",
      });

      await fetchVouches(); // Refresh the list
      return data;
    } catch (error: any) {
      console.error('Error creating vouch:', error);

      // Handle specific database constraint errors
      if (error.code === '23505') {
        throw new Error('You have already vouched for this person. Check your vouch history to edit your existing vouch.');
      }

      throw error;
    }
  };

  // Update an existing vouch
  const updateVouch = async (vouchId: string, formData: Partial<VouchFormData>) => {
    if (!user?.id) throw new Error('User not authenticated');
    if (!activeProfileId) throw new Error('Profile not found');

    try {
      // Use auth user's ID for the voucher check (RLS requires auth.uid() = voucher_id)
      // This works whether viewing personal profile or org profile
      const { data, error } = await supabase
        .from('vouches')
        .update({
          message: formData.message,
          rating: formData.rating,
          organization_id: formData.organization_id ?? undefined // Only update if provided
        })
        .eq('id', vouchId)
        .eq('voucher_id', user.id) // Use auth user ID (RLS will verify this)
        .select()
        .single();

      if (error) throw error;

      toastRef.current({
        title: "Vouch Updated",
        description: "Your vouch has been successfully updated.",
      });

      await fetchVouches(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error updating vouch:', error);
      throw error;
    }
  };

  // Delete a vouch (either one you gave or one you received)
  const deleteVouch = async (vouchId: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    if (!activeProfileId) throw new Error('Profile not found');

    try {
      // First try to delete as voucher (vouch you gave) - uses auth user ID for RLS
      const { error: voucherError, count: voucherCount } = await supabase
        .from('vouches')
        .delete()
        .eq('id', vouchId)
        .eq('voucher_id', user.id) // Use auth user ID (works for both personal and org view)
        .select('*', { count: 'exact', head: true });

      if (voucherError) throw voucherError;

      // If no rows affected as voucher, try as vouchee (vouch you received)
      if (voucherCount === 0) {
        const { error: voucheeError } = await supabase
          .from('vouches')
          .delete()
          .eq('id', vouchId)
          .eq('vouchee_id', activeProfileId);

        if (voucheeError) throw voucheeError;
      }

      await fetchVouches(); // Refresh the list
    } catch (error) {
      console.error('Error deleting vouch:', error);
      throw error;
    }
  };

  // Get vouches received by current profile
  const getReceivedVouches = () => {
    return vouches.filter(vouch => vouch.vouchee_id === activeProfileId);
  };

  // Get vouches given by current profile (includes vouches given on behalf of this org)
  const getGivenVouches = () => {
    return vouches.filter(vouch =>
      vouch.voucher_id === activeProfileId ||
      vouch.organization_id === activeProfileId
    );
  };

  useEffect(() => {
    if (activeProfileId) {
      fetchVouches();
      fetchStats();
    }
  }, [fetchStats, fetchVouches, activeProfileId]);

  return {
    loading,
    vouches,
    stats,
    searchUsers,
    checkExistingVouch,
    createVouch,
    updateVouch,
    deleteVouch,
    fetchVouches,
    getReceivedVouches,
    getGivenVouches
  };
};
