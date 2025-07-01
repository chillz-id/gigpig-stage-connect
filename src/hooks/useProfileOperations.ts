
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/auth';
import { User } from '@supabase/supabase-js';

export const useProfileOperations = () => {
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      console.log('=== FETCHING PROFILE ===', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          name,
          stage_name,
          bio,
          location,
          avatar_url,
          is_verified,
          created_at,
          updated_at,
          phone,
          website_url,
          instagram_url,
          twitter_url,
          youtube_url,
          facebook_url,
          tiktok_url,
          show_contact_in_epk,
          custom_show_types,
          profile_slug
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('=== PROFILE FETCH ERROR ===', error);
        
        // If no profile found, this might be expected for new users
        if (error.code === 'PGRST116') {
          console.log('=== NO PROFILE FOUND ===', userId);
          return null;
        }
        
        return null;
      }
      
      console.log('=== PROFILE FETCHED ===', data);
      return data;
    } catch (error) {
      console.error('=== PROFILE FETCH EXCEPTION ===', error);
      return null;
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      console.log('=== FETCHING ROLES ===', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('=== ROLES FETCH ERROR ===', error);
        return [];
      }
      
      console.log('=== ROLES FETCHED ===', data);
      return data || [];
    } catch (error) {
      console.error('=== ROLES FETCH EXCEPTION ===', error);
      return [];
    }
  };

  const updateProfile = async (user: User, updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('=== UPDATING PROFILE ===', user.id, updates);
      
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('=== PROFILE UPDATE ERROR ===', error);
        throw error;
      }

      console.log('=== PROFILE UPDATED ===');
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('=== PROFILE UPDATE EXCEPTION ===', error);
      toast({
        title: "Update Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  return { fetchProfile, fetchRoles, updateProfile };
};
