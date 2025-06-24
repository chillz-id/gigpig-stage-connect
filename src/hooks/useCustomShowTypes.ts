
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

export const useCustomShowTypes = () => {
  const { user } = useUser();
  const [customShowTypes, setCustomShowTypes] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadCustomShowTypes();
    }
  }, [user]);

  const loadCustomShowTypes = async () => {
    if (!user) return;

    try {
      // Load from user's profile metadata or a separate table
      const { data: profile } = await supabase
        .from('profiles')
        .select('custom_show_types')
        .eq('id', user.id)
        .single();

      if (profile?.custom_show_types) {
        setCustomShowTypes(profile.custom_show_types);
      }
    } catch (error) {
      console.error('Error loading custom show types:', error);
    }
  };

  const saveCustomShowType = async (showType: string) => {
    if (!user || !showType.trim()) return;

    const updatedTypes = [...new Set([...customShowTypes, showType.trim()])];
    setCustomShowTypes(updatedTypes);

    try {
      await supabase
        .from('profiles')
        .update({ custom_show_types: updatedTypes })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving custom show type:', error);
    }
  };

  return {
    customShowTypes,
    saveCustomShowType
  };
};
