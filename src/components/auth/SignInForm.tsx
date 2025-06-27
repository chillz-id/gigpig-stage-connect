
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import GoogleSignInButton from './GoogleSignInButton';

interface SignInFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  isGoogleLoading: boolean;
}

const SignInForm: React.FC<SignInFormProps> = ({
  onSignIn,
  onGoogleSignIn,
  isLoading,
  isGoogleLoading,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleRememberMeChange = (checked: boolean | "indeterminate") => {
    setRememberMe(checked === true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSignIn(email, password);
  };

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>

      <GoogleSignInButton
        onGoogleSignIn={onGoogleSignIn}
        isLoading={isGoogleLoading}
        buttonText="Continue with Google"
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-neutral-900 px-4 text-neutral-500">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="signin-email" className="block text-sm mb-2">Email</Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={handleRememberMeChange}
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
    </div>
  );
};

export default SignInForm;
