
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/auth';

export const useAuthOperations = () => {
  const { toast } = useToast();

  const signUp = async (email: string, password: string, userData: any = {}) => {
    try {
      console.log('=== STARTING SIGN UP ===', email, userData);
      
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
        console.error('=== SIGN UP ERROR ===', error);
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      console.log('=== SIGN UP SUCCESS ===', data);

      // If user is created but not confirmed, show confirmation message
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      } else if (data.user) {
        // If user is immediately confirmed, wait a moment for the trigger to create profile
        console.log('=== USER CONFIRMED IMMEDIATELY ===');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile was created by trigger
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError || !profile) {
          console.log('=== PROFILE NOT CREATED BY TRIGGER, CREATING MANUALLY ===');
          
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
            console.error('=== MANUAL PROFILE CREATION ERROR ===', createProfileError);
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
              console.error('=== ROLE CREATION ERROR ===', roleError);
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
      console.error('=== SIGN UP EXCEPTION ===', error);
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
      console.log('=== STARTING SIGN IN ===', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('=== SIGN IN ERROR ===', error);
        
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
        console.log('=== SIGN IN SUCCESS ===', data.user.email);
        
        toast({
          title: "Welcome back!",
          description: `Successfully signed in as ${data.user.email}`,
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('=== SIGN IN EXCEPTION ===', error);
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
      console.log('=== STARTING SIGN OUT ===');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('=== SIGN OUT ERROR ===', error);
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { signIn, signUp, signOut };
};
