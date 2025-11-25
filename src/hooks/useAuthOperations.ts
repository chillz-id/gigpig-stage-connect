import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthOperations = () => {
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []); // CRITICAL: Empty deps - function never changes

  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { error };
  }, []); // CRITICAL: Empty deps - function never changes

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []); // CRITICAL: Empty deps - function never changes

  return {
    signIn,
    signUp,
    signOut,
  };
};
