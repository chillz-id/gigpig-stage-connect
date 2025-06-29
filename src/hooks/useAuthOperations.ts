
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/auth';

export const useAuthOperations = () => {
  const { toast } = useToast();

  const signUp = async (email: string, password: string, userData: any = {}) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Sign up exception:', error);
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });


      if (error) {
        console.error('=== SIGN IN ERROR ===');
        console.error('Error code:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email address before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
        }
        
        toast({
          title: "Sign In Error",
          description: errorMessage,
          variant: "destructive",
        });
        return { error };
      }

      if (data?.user) {
        
        // Check if user has admin role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        
        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${data.user.email}`,
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('=== SIGN IN EXCEPTION ===');
      console.error('Exception:', error);
      console.error('Exception message:', error.message);
      toast({
        title: "Sign In Error",
        description: error.message || 'An unexpected error occurred during sign in.',
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { signUp, signIn, signOut };
};
