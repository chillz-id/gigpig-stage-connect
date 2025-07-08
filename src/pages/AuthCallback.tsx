import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Processing OAuth callback
        
        // Parse the hash fragment to handle the OAuth response
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (error) {
          // OAuth error in URL
          toast({
            title: "Authentication Failed",
            description: errorDescription || error,
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        
        // Handle the auth callback
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          // Auth callback error
          toast({
            title: "Authentication Error",
            description: sessionError.message,
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        if (data.session) {
          // Auth callback successful
          
          // Wait for user data to be processed
          setTimeout(async () => {
            try {
              // Check if profile was created
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.session.user.id)
                .single();
              
              if (profileError || !profile) {
                // Creating profile
                
                // Create profile if it doesn't exist
                const { error: createError } = await supabase
                  .from('profiles')
                  .insert({
                    id: data.session.user.id,
                    email: data.session.user.email!,
                    name: data.session.user.user_metadata?.full_name || 
                          data.session.user.user_metadata?.name || 
                          data.session.user.email!.split('@')[0]
                  });
                
                if (createError) {
                  // Profile creation error
                } else {
                  // Profile created successfully
                }
              } else {
                // Profile exists
              }
              
              // Check if user has roles
              const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', data.session.user.id);
              
              if (rolesError || !roles || roles.length === 0) {
                // Creating default role
                
                // Create default member role
                const { error: roleError } = await supabase
                  .from('user_roles')
                  .insert({
                    user_id: data.session.user.id,
                    role: 'member'
                  });
                
                if (roleError && !roleError.message.includes('duplicate key')) {
                  // Role creation error
                } else {
                  // Default role created
                }
              } else {
                // User has roles
              }
              
              toast({
                title: "Welcome!",
                description: "Successfully signed in with Google.",
              });
              
              navigate('/dashboard');
            } catch (setupError) {
              // User setup error
              toast({
                title: "Setup Error",
                description: "There was an issue setting up your account. Please try again.",
                variant: "destructive",
              });
              navigate('/auth');
            }
          }, 1500); // Give triggers time to fire
        } else {
          // No session found
          toast({
            title: "Authentication Failed",
            description: "No session was created. Please try again.",
            variant: "destructive",
          });
          navigate('/auth');
        }
      } catch (error: any) {
        // Auth callback exception
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
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;