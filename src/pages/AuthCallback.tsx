import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkForClaimableProfiles } from '@/services/directory/claim-service';

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
  const createRoleWithRetry = useCallback(async (userId: string, role: string = 'member') => {
    return await retryOperation(async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
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

        // Parse URL query params for role context (passed from HorizontalAuthBanner)
        const searchParams = new URLSearchParams(window.location.search);
        const intendedRole = searchParams.get('role');
        const signupSource = searchParams.get('from');

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
        const rolesResult = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        let roles = rolesResult.data;
        if (rolesResult.error) {
          console.error('Error checking roles:', rolesResult.error);
          // Don't fail here, continue with role creation
        }

        if (!roles || roles.length === 0) {
          // Use intended role from URL params (e.g., comedian_lite from /gigs signup)
          const roleToCreate = intendedRole || 'member';
          console.log('No roles found, creating role:', roleToCreate);

          try {
            await createRoleWithRetry(user.id, roleToCreate);
            console.log(`Role '${roleToCreate}' created successfully`);

            // Also add 'member' role if creating a non-member role
            if (roleToCreate !== 'member') {
              await createRoleWithRetry(user.id, 'member');
              console.log("Additional 'member' role created");
            }

            // Refresh roles array for subsequent logic
            const { data: updatedRoles } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', user.id);
            if (updatedRoles) {
              roles = updatedRoles;
            }
          } catch (roleError) {
            console.error('Failed to create role:', roleError);
            // Don't fail authentication for role creation failure
          }
        } else {
          console.log('User has roles:', roles);
        }
        
        setStatus('Completing setup...');

        // Check if user has any comedy profiles (not just member role)
        // Include comedian_lite as a valid comedy profile role
        const hasComedyProfile = roles && roles.some(role =>
          ['comedian', 'comedian_lite', 'promoter', 'manager', 'photographer', 'videographer'].includes(role.role)
        );

        // Check if user has comedian_lite role specifically
        const isComedianLite = roles && roles.some(role => role.role === 'comedian_lite');

        // Check if user needs post-signup setup (organization or manager roles)
        const needsPostSignupSetup = roles && roles.some(role =>
          ['organization', 'manager'].includes(role.role)
        );

        // Check for claimable directory profiles (for comedian_lite users)
        if (isComedianLite && user.email) {
          setStatus('Checking for existing profiles...');
          try {
            const claimableProfiles = await checkForClaimableProfiles(user.email);
            if (claimableProfiles.length > 0) {
              // Store in sessionStorage for the claim flow
              sessionStorage.setItem('claimableProfiles', JSON.stringify(claimableProfiles));
              sessionStorage.setItem('pendingClaim', 'true');
              console.log('Found claimable profiles:', claimableProfiles.length);
            }
          } catch (claimError) {
            console.error('Error checking claimable profiles:', claimError);
            // Don't fail auth for claim check failure
          }
        }

        // Determine navigation destination
        if (needsPostSignupSetup) {
          toast({
            title: "Welcome to Stand Up Sydney!",
            description: "Let's complete your profile setup.",
          });
          navigate('/post-signup-setup');
        } else if (isComedianLite && signupSource === 'gigs') {
          // comedian_lite users from /gigs signup go back to /gigs
          toast({
            title: "Welcome to Stand Up Sydney!",
            description: "Browse available gig opportunities.",
          });
          navigate('/gigs');
        } else if (!hasComedyProfile) {
          toast({
            title: "Welcome to Stand Up Sydney!",
            description: "Let's set up your profile to get started.",
          });
          navigate('/post-signup-setup');
        } else {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in with Google.",
          });
          navigate('/dashboard');
        }
        
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
      <div className="min-h-screen flex items-center justify-center bg-[#131b2b]">
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
