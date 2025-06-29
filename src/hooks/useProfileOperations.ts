
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/auth';
import { User } from '@supabase/supabase-js';

export const useProfileOperations = () => {
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('=== PROFILE FETCH ERROR ===');
        console.error('Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('=== PROFILE FETCH EXCEPTION ===');
      console.error('Exception:', error);
      return null;
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('=== ROLES FETCH ERROR ===');
        console.error('Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('=== ROLES FETCH EXCEPTION ===');
      console.error('Exception:', error);
      return [];
    }
  };

  const updateProfile = async (user: User, updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('=== PROFILE UPDATE ERROR ===');
        console.error('Error:', error);
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('=== PROFILE UPDATE EXCEPTION ===');
      console.error('Exception:', error);
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
