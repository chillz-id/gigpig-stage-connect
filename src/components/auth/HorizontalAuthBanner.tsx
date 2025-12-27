import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import GoogleSignInButton from './GoogleSignInButton';
import { Calendar, CheckCircle2, Bell, Star } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Horizontal Authentication Banner
 *
 * Compact, full-width authentication component for anonymous users on Gigs page.
 * Features Sign In and Sign Up tabs with horizontal form layouts.
 * - Sign In: Email, Password (2-column grid)
 * - Sign Up: First Name, Last Name, Mobile, Email, Password (4-column desktop, 2-column mobile)
 * - Google OAuth above forms with OR divider
 * - Auto-assigns comedian_lite role on sign up
 */
export function HorizontalAuthBanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+61'); // Default to Australia

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = import.meta.env.VITE_OAUTH_REDIRECT_URL ||
                         `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
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
        toast({
          title: "Google Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Google Authentication Error",
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
      toast({
        title: "Signed In Successfully",
        description: "Welcome back! Start marking your availability.",
      });
      // User stays on /gigs page - HorizontalAuthBanner will be replaced with ProfileHeader automatically
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !signUpEmail.trim() || !mobile.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (signUpPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const userData = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      mobile: `${countryCode}${mobile.trim().replace(/^0+/, '')}`, // Combine country code with mobile, remove leading zeros
      role: 'comedian_lite',
      roles: ['comedian_lite', 'member']
    };

    const { error } = await signUp(signUpEmail.trim(), signUpPassword, userData);

    if (!error) {
      toast({
        title: "Account Created! 🎉",
        description: "Welcome! You can now mark your availability for gigs.",
      });
      // User stays on /gigs page - HorizontalAuthBanner will be replaced with ProfileHeader automatically
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
      {/* 2-Column Layout: Form (40%) + Features (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Auth Forms */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto mb-6">
              <TabsTrigger
                value="signin"
                className="pb-2 text-center font-medium text-base border-b-2 border-indigo-500 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-indigo-500 data-[state=inactive]:text-neutral-300 data-[state=inactive]:border-transparent rounded-none"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="pb-2 text-center font-medium text-base bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-indigo-500 data-[state=inactive]:text-neutral-300 data-[state=inactive]:border-transparent border-b-2 rounded-none"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="mt-0">
              <div className="space-y-4">
                <GoogleSignInButton
                  onGoogleSignIn={handleGoogleAuth}
                  isLoading={isGoogleLoading}
                  buttonText="Continue with Google"
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-purple-800 px-4 text-neutral-300">or</span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="block text-sm mb-1.5 text-white">Email</Label>
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
                    <Label htmlFor="signin-password" className="block text-sm mb-1.5 text-white">Password</Label>
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

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="mt-0">
              <div className="space-y-4">
                <GoogleSignInButton
                  onGoogleSignIn={handleGoogleAuth}
                  isLoading={isGoogleLoading}
                  buttonText="Sign up with Google"
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-purple-800 px-4 text-neutral-300">or</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="signup-first-name" className="block text-sm mb-1.5 text-white">First Name</Label>
                      <Input
                        id="signup-first-name"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-last-name" className="block text-sm mb-1.5 text-white">Last Name</Label>
                      <Input
                        id="signup-last-name"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-mobile" className="block text-sm mb-1.5 text-white">Mobile</Label>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[100px] h-11 rounded-md bg-neutral-800/70 text-white border-0 focus:ring-2 focus:ring-indigo-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="+61" className="text-white hover:bg-gray-700">🇦🇺 +61</SelectItem>
                          <SelectItem value="+1" className="text-white hover:bg-gray-700">🇺🇸 +1</SelectItem>
                          <SelectItem value="+44" className="text-white hover:bg-gray-700">🇬🇧 +44</SelectItem>
                          <SelectItem value="+64" className="text-white hover:bg-gray-700">🇳🇿 +64</SelectItem>
                          <SelectItem value="+33" className="text-white hover:bg-gray-700">🇫🇷 +33</SelectItem>
                          <SelectItem value="+49" className="text-white hover:bg-gray-700">🇩🇪 +49</SelectItem>
                          <SelectItem value="+81" className="text-white hover:bg-gray-700">🇯🇵 +81</SelectItem>
                          <SelectItem value="+86" className="text-white hover:bg-gray-700">🇨🇳 +86</SelectItem>
                          <SelectItem value="+91" className="text-white hover:bg-gray-700">🇮🇳 +91</SelectItem>
                          <SelectItem value="+65" className="text-white hover:bg-gray-700">🇸🇬 +65</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="signup-mobile"
                        type="tel"
                        placeholder="400 000 000"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        className="flex-1 h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-email" className="block text-sm mb-1.5 text-white">Email</Label>
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
                    <Label htmlFor="signup-password" className="block text-sm mb-1.5 text-white">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                  >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Features List */}
        <div className="lg:col-span-3 flex flex-col justify-center">
          <div className="space-y-1 mb-4">
            <h3 className="text-2xl font-bold text-white">
              Join Sydney's Premier Comedy Network
            </h3>
            <p className="text-white/70 text-sm">
              Everything you need to launch, grow & manage your comedy career
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">
                  Browse{' '}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="line-through decoration-white/50 cursor-help">1000+</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eventually! Just iD Comedy shows for now</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {' '}Comedy Gigs
                </h4>
                <p className="text-white/60 text-xs">Access the largest database of comedy shows, open mics, and paid gigs across Sydney & Australia</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">Mark Your Availability</h4>
                <p className="text-white/60 text-xs">Click events in the calendar to instantly let promoters know when you're free to perform</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">Get Discovered by Promoters</h4>
                <p className="text-white/60 text-xs">Share your profile with promoters to easily showcase your style</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">Track Your Gigs</h4>
                <p className="text-white/60 text-xs">Easily track your upcoming gigs with calendar sync</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">Instant Gig Notifications <span className="text-white/50 font-normal">(optional)</span></h4>
                <p className="text-white/60 text-xs">Get alerted when new spots open up or promoters are looking to book you</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm mb-0.5">Vouch System</h4>
                <p className="text-white/60 text-xs">Send & Receive Vouches from respected comedians, clubs and promoters to easily show new promoters</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
