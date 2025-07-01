
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProfileUrl = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateProfileUrl = async (userId: string, newSlug: string) => {
    setIsUpdating(true);
    
    try {
      // Check if slug is already taken by another user
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('profile_slug', newSlug)
        .neq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingProfile) {
        toast({
          title: "URL not available",
          description: "This profile URL is already taken. Please choose a different one.",
          variant: "destructive",
        });
        return { error: new Error('Slug already taken') };
      }

      // Update the profile with new slug
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_slug: newSlug })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: "Profile URL updated",
        description: "Your profile URL has been successfully updated.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating profile URL:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile URL",
        variant: "destructive",
      });
      return { error };
    } finally {
      setIsUpdating(false);
    }
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return {
    isUpdating,
    updateProfileUrl,
    generateSlugFromName
  };
};
