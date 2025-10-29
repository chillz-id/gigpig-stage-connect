import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vouch, VouchWithProfiles, VouchFormData, VouchStats, UserSearchResult } from '@/types/vouch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useVouches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  const [loading, setLoading] = useState(false);
  const [vouches, setVouches] = useState<VouchWithProfiles[]>([]);
  const [stats, setStats] = useState<VouchStats | null>(null);

  // Fetch vouches for current user
  const fetchVouches = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vouches')
        .select(`
          *,
          voucher_profile:voucher_id(id, name, stage_name, avatar_url),
          vouchee_profile:vouchee_id(id, name, stage_name, avatar_url)
        `)
        .or(`voucher_id.eq.${user.id},vouchee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVouches(data || []);
    } catch (error: any) {
      console.error('Error fetching vouches:', error);
      // Only show error toast for real errors (not "no rows" situations)
      if (error?.code && error.code !== 'PGRST116') {
        toastRef.current({
          title: "Error",
          description: "Unable to load vouches. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch vouch statistics
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_vouch_stats', { user_id_param: user.id });

      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching vouch stats:', error);
    }
  }, [user?.id]);

  // Search for users and organizations to vouch for
  const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    if (!query.trim() || !user?.id) return [];

    try {
      // Search profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          stage_name,
          avatar_url,
          user_roles!inner(role)
        `)
        .neq('id', user.id)
        .or(`name.ilike.%${query}%,stage_name.ilike.%${query}%`)
        .limit(8);

      if (profileError) throw profileError;

      // Search organizations
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, logo_url, description, is_active')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(5);

      if (orgError) console.error('Error searching organizations:', orgError);

      // Map profiles
      const profileResults: UserSearchResult[] = (profileData || []).map(profile => ({
        id: profile.id,
        name: profile.name || '',
        stage_name: profile.stage_name,
        avatar_url: profile.avatar_url,
        roles: profile.user_roles.map((r: any) => r.role),
        type: 'profile' as const
      }));

      // Map organizations
      const orgResults: UserSearchResult[] = (orgData || []).map(org => ({
        id: org.id,
        name: org.name,
        stage_name: null,
        avatar_url: org.logo_url,
        roles: ['organization'],
        type: 'organization' as const
      }));

      return [...profileResults, ...orgResults];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Check if vouch already exists between two users
  const checkExistingVouch = async (voucheeId: string): Promise<Vouch | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_existing_vouch', { 
          giver_id: user.id, 
          receiver_id: voucheeId 
        });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error checking existing vouch:', error);
      return null;
    }
  };

  // Create a new vouch
  const createVouch = async (formData: VouchFormData) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      // Check if vouch already exists
      const existing = await checkExistingVouch(formData.vouchee_id);
      if (existing) {
        throw new Error('You have already vouched for this person. You can edit your existing vouch instead.');
      }

      const { data, error } = await supabase
        .from('vouches')
        .insert({
          voucher_id: user.id,
          vouchee_id: formData.vouchee_id,
          message: formData.message,
          rating: formData.rating
        })
        .select()
        .single();

      if (error) throw error;

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

    try {
      const { data, error } = await supabase
        .from('vouches')
        .update({
          message: formData.message,
          rating: formData.rating
        })
        .eq('id', vouchId)
        .eq('voucher_id', user.id) // Ensure user owns this vouch
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

  // Delete a vouch
  const deleteVouch = async (vouchId: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('vouches')
        .delete()
        .eq('id', vouchId)
        .eq('voucher_id', user.id); // Ensure user owns this vouch

      if (error) throw error;

      toastRef.current({
        title: "Vouch Deleted",
        description: "Your vouch has been successfully deleted.",
      });

      await fetchVouches(); // Refresh the list
    } catch (error) {
      console.error('Error deleting vouch:', error);
      throw error;
    }
  };

  // Get vouches received by current user
  const getReceivedVouches = () => {
    return vouches.filter(vouch => vouch.vouchee_id === user?.id);
  };

  // Get vouches given by current user
  const getGivenVouches = () => {
    return vouches.filter(vouch => vouch.voucher_id === user?.id);
  };

  useEffect(() => {
    if (user?.id) {
      fetchVouches();
      fetchStats();
    }
  }, [fetchStats, fetchVouches, user?.id]);

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
