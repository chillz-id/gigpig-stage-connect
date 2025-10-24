import { supabase } from '@/integrations/supabase/client';

export interface SignUpOptions {
  redirectTo?: string;
  userData?: Record<string, any>;
}

export const authService = {
  signUp(email: string, password: string, { redirectTo, userData = {} }: SignUpOptions = {}) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: userData,
      },
    });
  },

  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signOut() {
    return supabase.auth.signOut();
  },
};

export type AuthService = typeof authService;
