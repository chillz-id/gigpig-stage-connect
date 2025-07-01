
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
      console.log('=== USER ALREADY LOGGED IN, REDIRECTING ===', user.email);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      console.log('=== GOOGLE SIGN IN ATTEMPT ===');
      console.log('Current origin:', window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('=== GOOGLE SIGN IN ERROR ===', error);
        toast({
          title: "Google Sign In Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('=== GOOGLE SIGN IN INITIATED ===', data);
      }
    } catch (error: any) {
      console.error('=== GOOGLE SIGN IN EXCEPTION ===', error);
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
    
    console.log('=== HANDLING SIGN IN ===', email);
    const { error } = await signIn(email, password);
    
    if (!error) {
      console.log('=== SIGN IN SUCCESS, REDIRECTING ===');
      navigate(from, { replace: true });
    } else {
      console.log('=== SIGN IN FAILED ===', error);
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (email: string, password: string, userData: any) => {
    setIsLoading(true);
    
    console.log('=== HANDLING SIGN UP ===', email, userData);
    const { error } = await signUp(email, password, userData);
    
    if (!error) {
      console.log('=== SIGN UP SUCCESS ===');
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
