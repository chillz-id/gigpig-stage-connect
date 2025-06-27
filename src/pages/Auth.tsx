
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mic, Chrome } from 'lucide-react';

const Auth = () => {
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFirstName, setSignUpFirstName] = useState('');
  const [signUpLastName, setSignUpLastName] = useState('');
  const [signUpMobile, setSignUpMobile] = useState('');
  const [isComedian, setIsComedian] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        toast({
          title: "Google Sign In Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Google Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsGoogleLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInEmail, signInPassword);
    
    if (!error) {
      navigate(from, { replace: true });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signUpFirstName.trim() || !signUpLastName.trim() || !signUpEmail.trim() || !signUpMobile.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const userData = {
      name: `${signUpFirstName} ${signUpLastName}`,
      first_name: signUpFirstName,
      last_name: signUpLastName,
      mobile: signUpMobile,
      role: isComedian ? 'comedian' : 'member',
      roles: isComedian ? ['comedian'] : ['member']
    };
    
    const { error } = await signUp(signUpEmail, signUpPassword, userData);
    
    if (!error) {
      navigate('/profile', { replace: true });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans text-neutral-200 relative overflow-hidden">
      {/* Reactive Glow */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-60 blur-3xl transition-opacity duration-700"
        style={{
          background: 'radial-gradient(600px circle at 50% 50%, rgba(168,85,247,0.35), transparent 60%)'
        }}
      />
      
      {/* Card */}
      <div className="w-full max-w-md px-8 py-10 bg-neutral-900/80 backdrop-blur rounded-xl shadow-2xl ring-1 ring-neutral-800 space-y-8 animate-fade-in">
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

          <TabsContent value="signin" className="space-y-6 mt-8">
            <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full h-11 flex items-center justify-center gap-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white ring-1 ring-neutral-700/60 font-medium text-sm"
              variant="outline"
            >
              <Chrome className="w-5 h-5" />
              <span>{isGoogleLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-900 px-4 text-neutral-500">or</span>
              </div>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <Label htmlFor="signin-email" className="block text-sm mb-2">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                  className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                />
              </div>

              <div>
                <Label htmlFor="signin-password" className="block text-sm mb-2">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                  className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    className="h-4 w-4 accent-indigo-500"
                  />
                  <Label htmlFor="remember-me" className="text-sm cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-6 mt-8">
            <h2 className="text-3xl font-semibold tracking-tight">Create account</h2>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full h-11 flex items-center justify-center gap-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white ring-1 ring-neutral-700/60 font-medium text-sm"
              variant="outline"
            >
              <Chrome className="w-5 h-5" />
              <span>{isGoogleLoading ? 'Signing up...' : 'Sign up with Google'}</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-900 px-4 text-neutral-500">or</span>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signup-first-name" className="block text-sm mb-2">First Name</Label>
                  <Input
                    id="signup-first-name"
                    type="text"
                    placeholder="John"
                    value={signUpFirstName}
                    onChange={(e) => setSignUpFirstName(e.target.value)}
                    required
                    className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-last-name" className="block text-sm mb-2">Last Name</Label>
                  <Input
                    id="signup-last-name"
                    type="text"
                    placeholder="Doe"
                    value={signUpLastName}
                    onChange={(e) => setSignUpLastName(e.target.value)}
                    required
                    className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="signup-mobile" className="block text-sm mb-2">Mobile</Label>
                <Input
                  id="signup-mobile"
                  type="tel"
                  placeholder="+61 400 000 000"
                  value={signUpMobile}
                  onChange={(e) => setSignUpMobile(e.target.value)}
                  required
                  className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                />
              </div>

              <div>
                <Label htmlFor="signup-email" className="block text-sm mb-2">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                />
              </div>

              <div>
                <Label htmlFor="signup-password" className="block text-sm mb-2">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-comedian"
                  checked={isComedian}
                  onCheckedChange={setIsComedian}
                  className="h-4 w-4 accent-indigo-500"
                />
                <Label htmlFor="is-comedian" className="text-sm cursor-pointer flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  I'm a comedian
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
