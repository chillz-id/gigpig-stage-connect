
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/auth';

export const useAuthOperations = () => {
  const { toast } = useToast();

  const signUp = async (email: string, password: string, userData: any = {}) => {
    try {
      // Starting sign up process
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        console.error('Sign up error:', error.message);
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Sign up successful

      // If user is created but not confirmed, show confirmation message
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      } else if (data.user) {
        // If user is immediately confirmed, wait a moment for the trigger to create profile
        // User confirmed immediately
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created by trigger
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle(); // Use maybeSingle to handle both no rows and multiple rows
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile check error:', profileError.message);
        }
        
        if (!profile) {
          // Profile not created by trigger, creating manually
          
          // Create profile manually if trigger didn't work
          const name = userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || data.user.email!.split('@')[0];
          
          // Generate a unique profile slug
          const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          let profileSlug = baseSlug;
          let counter = 1;
          
          // Check if slug exists and increment if needed
          while (true) {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('profile_slug', profileSlug)
              .single();
              
            if (!existingProfile) break;
            
            profileSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: name,
              profile_slug: profileSlug
            });
          
          if (createProfileError) {
            console.error('Profile creation error:', createProfileError.message);
          }
        }
        
        // Ensure user roles are created
        if (userData.role || userData.roles) {
          const rolesToCreate = userData.roles || [userData.role || 'member'];
          
          for (const role of rolesToCreate) {
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: data.user.id,
                role: role
              });
            
            if (roleError && !roleError.message.includes('duplicate key')) {
              console.error('Role creation error:', roleError.message);
            }
          }
        }
        
        toast({
          title: "Account created successfully",
          description: "Welcome! Your account has been created.",
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign up exception:', error.message);
      toast({
        title: "Sign Up Error",
        description: error.message || 'An unexpected error occurred during sign up.',
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Starting sign in process
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message);
        
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
        // Sign in successful
        
        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${data.user.email}`,
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign in exception:', error.message);
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
      // Starting sign out process
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { signIn, signUp, signOut };
};
