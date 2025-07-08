
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthLayout from '@/components/auth/AuthLayout';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      // User already logged in, redirecting
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Initiating Google sign in
      
      // Use environment variable for redirect URL, fallback to current origin
      const redirectUrl = import.meta.env.VITE_OAUTH_REDIRECT_URL || 
                         `${window.location.origin}/auth/callback`;
      
      // OAuth redirect configured
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        // Google sign in error
        toast({
          title: "Google Sign In Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Google sign in initiated
      }
    } catch (error: any) {
      // Google sign in exception
      toast({
        title: "Google Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsGoogleLoading(false);
  };

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Processing sign in
    const { error } = await signIn(email, password);
    
    if (!error) {
      // Sign in successful
      navigate(from, { replace: true });
    } else {
      // Sign in failed
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (email: string, password: string, userData: any) => {
    setIsLoading(true);
    
    // Processing sign up
    const { error } = await signUp(email, password, userData);
    
    if (!error) {
      // Sign up successful
      // Don't redirect immediately, wait for email confirmation or auto-login
      toast({
        title: "Account Created",
        description: "Your account has been created successfully. Please check your email if confirmation is required.",
      });
    } else {
      console.log('=== SIGN UP FAILED ===', error);
    }
    
    setIsLoading(false);
  };

  return (
    <AuthLayout>
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto">
          <TabsTrigger 
            value="signin" 
            className="pb-2 text-center font-medium tracking-tight text-lg border-b-2 border-indigo-500 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-indigo-500 data-[state=inactive]:text-neutral-400 data-[state=inactive]:border-transparent rounded-none"
          >
            Sign In
          </TabsTrigger>
          <TabsTrigger 
            value="signup" 
            className="pb-2 text-center font-medium tracking-tight text-lg bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-indigo-500 data-[state=inactive]:text-neutral-400 data-[state=inactive]:border-transparent border-b-2 rounded-none"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="mt-0">
          <SignInForm
            onSignIn={handleSignIn}
            onGoogleSignIn={handleGoogleSignIn}
            isLoading={isLoading}
            isGoogleLoading={isGoogleLoading}
          />
        </TabsContent>

        <TabsContent value="signup" className="mt-0">
          <SignUpForm
            onSignUp={handleSignUp}
            onGoogleSignIn={handleGoogleSignIn}
            isLoading={isLoading}
            isGoogleLoading={isGoogleLoading}
          />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
};

export default Auth;
