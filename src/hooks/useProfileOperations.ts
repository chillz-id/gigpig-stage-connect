
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/auth';
import { User } from '@supabase/supabase-js';

export const useProfileOperations = () => {
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      // Fetching user profile
      
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
          profile_slug,
          years_experience
        `)
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error.message);
        
        // If no profile found, this might be expected for new users
        if (error.code === 'PGRST116') {
          // No profile found for user
          return null;
        }
        
        return null;
      }
      
      // Profile fetched successfully
      return data;
    } catch (error) {
      console.error('Profile fetch exception:', error);
      return null;
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      // Fetching user roles
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Roles fetch error:', error.message);
        return [];
      }
      
      // Roles fetched successfully
      return data || [];
    } catch (error) {
      console.error('Roles fetch exception:', error);
      return [];
    }
  };

  const updateProfile = async (user: User, updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      // Updating user profile
      
      // If updating name, also generate/update profile slug if not already set
      let finalUpdates = { ...updates };
      if (updates.name) {
        // Check if user already has a profile_slug
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('profile_slug')
          .eq('id', user.id)
          .single();
          
        if (!currentProfile?.profile_slug) {
          // Generate a unique profile slug
          const baseSlug = updates.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          let profileSlug = baseSlug;
          let counter = 1;
          
          // Check if slug exists and increment if needed
          while (true) {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('profile_slug', profileSlug)
              .neq('id', user.id) // Exclude current user
              .single();
              
            if (!existingProfile) break;
            
            profileSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          finalUpdates.profile_slug = profileSlug;
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ ...finalUpdates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error.message);
        throw error;
      }

      // Profile updated successfully
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Profile update exception:', error.message);
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
