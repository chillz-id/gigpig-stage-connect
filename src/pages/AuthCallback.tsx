import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Processing authentication...');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper function to generate profile slug
  const generateProfileSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Helper function to ensure unique profile slug
  const ensureUniqueProfileSlug = useCallback(async (baseSlug: string, userId: string): Promise<string> => {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('profile_slug', slug)
        .neq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No existing profile with this slug, we can use it
        return slug;
      }
      
      if (error) {
        console.error('Error checking profile slug:', error);
        return slug; // Return the slug anyway
      }
      
      // Slug exists, try with counter
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }, []);

  // Retry mechanism for profile creation
  const retryOperation = useCallback(async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }, []);

  // Enhanced profile creation with error handling
  const createProfileWithRetry = useCallback(async (user: any) => {
    const displayName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'User';
    
    const baseSlug = generateProfileSlug(displayName);
    const uniqueSlug = await ensureUniqueProfileSlug(baseSlug, user.id);
    
    const profileData = {
      id: user.id,
      email: user.email,
      name: displayName,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      profile_slug: uniqueSlug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await retryOperation(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    });
  }, [ensureUniqueProfileSlug, retryOperation]);

  // Enhanced role creation with error handling
  const createRoleWithRetry = useCallback(async (userId: string) => {
    return await retryOperation(async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'member'
        })
        .select()
        .single();
      
      if (error && !error.message.includes('duplicate key')) {
        throw error;
      }
      
      return data;
    });
  }, [retryOperation]);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Processing OAuth callback...');
        
        // Parse the hash fragment to handle the OAuth response
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          console.error('OAuth error in URL:', error, errorDescription);
          toast({
            title: "Authentication Failed",
            description: errorDescription || error,
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        
        setStatus('Retrieving session...');
        
        // Handle the auth callback
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast({
            title: "Authentication Error",
            description: sessionError.message,
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        if (!data.session) {
          console.error('No session found');
          toast({
            title: "Authentication Failed",
            description: "No session was created. Please try again.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        const user = data.session.user;
        console.log('User authenticated:', user.id, user.email);
        
        // Wait for potential database triggers to fire
        setStatus('Setting up your account...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if profile was created by trigger
        setStatus('Checking profile status...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
          // Don't fail here, continue with manual creation
        }
        
        if (!profile) {
          setStatus('Creating your profile...');
          console.log('Profile not found, creating manually');
          
          try {
            const createdProfile = await createProfileWithRetry(user);
            console.log('Profile created successfully:', createdProfile);
          } catch (createError) {
            console.error('Failed to create profile:', createError);
            toast({
              title: "Profile Creation Failed",
              description: "Unable to create your profile. Please try again or contact support.",
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }
        } else {
          console.log('Profile exists:', profile);
        }
        
        // Check if user has roles
        setStatus('Setting up permissions...');
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);
        
        if (rolesError) {
          console.error('Error checking roles:', rolesError);
          // Don't fail here, continue with role creation
        }
        
        if (!roles || roles.length === 0) {
          console.log('No roles found, creating default member role');
          
          try {
            await createRoleWithRetry(user.id);
            console.log('Default role created successfully');
          } catch (roleError) {
            console.error('Failed to create role:', roleError);
            // Don't fail authentication for role creation failure
          }
        } else {
          console.log('User has roles:', roles);
        }
        
        setStatus('Completing setup...');
        
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Google.",
        });
        
        navigate('/dashboard');
        
      } catch (error: any) {
        console.error('Auth callback exception:', error);
        toast({
          title: "Authentication Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [createProfileWithRetry, createRoleWithRetry, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{status}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;
