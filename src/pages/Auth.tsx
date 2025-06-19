
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
import { Mic, Users, Sparkles } from 'lucide-react';

const Auth = () => {
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpStageName, setSignUpStageName] = useState('');
  const [isPromoter, setIsPromoter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

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
    setIsLoading(true);
    
    const userData = {
      name: signUpName,
      stage_name: signUpStageName,
      role: isPromoter ? 'promoter' : 'comedian'
    };
    
    const { error } = await signUp(signUpEmail, signUpPassword, userData);
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Mic className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Comedy Connect</h1>
          </div>
          <p className="text-muted-foreground">
            Connect comedians with opportunities
          </p>
        </div>

        <Card className="professional-card">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Welcome back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="comedian@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full professional-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Create your account</CardTitle>
                <CardDescription>
                  Join the comedy community today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="comedian@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your full name"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-stage-name">Stage Name (Optional)</Label>
                    <Input
                      id="signup-stage-name"
                      type="text"
                      placeholder="Your stage name"
                      value={signUpStageName}
                      onChange={(e) => setSignUpStageName(e.target.value)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">I am a:</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is-promoter"
                        checked={isPromoter}
                        onCheckedChange={(checked) => setIsPromoter(checked as boolean)}
                      />
                      <Label htmlFor="is-promoter" className="text-sm font-normal">
                        Event Promoter
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isPromoter 
                        ? "You'll be able to create events and book comedians"
                        : "You'll be able to apply for comedy shows and gigs"
                      }
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full professional-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center gap-1">
              <Mic className="w-4 h-4" />
              <span>For Comedians</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>For Promoters</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>Built for Comedy</span>
            </div>
          </div>
          <p>
            By signing up, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
