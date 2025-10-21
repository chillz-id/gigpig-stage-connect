
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mic, Users, Briefcase, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import GoogleSignInButton from './GoogleSignInButton';

interface SignUpFormProps {
  onSignUp: (email: string, password: string, userData: any) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  isGoogleLoading: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  onSignUp,
  onGoogleSignIn,
  isLoading,
  isGoogleLoading,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { toast } = useToast();

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !mobile.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare user data with proper structure
    const userData = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      mobile: mobile.trim(),
      role: selectedRoles.length > 0 ? selectedRoles[0] : 'member',
      roles: selectedRoles.length > 0 ? [...selectedRoles, 'member'] : ['member']
    };
    
    // Submitting form with user data
    await onSignUp(email.trim(), password, userData);
  };

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-3xl font-semibold tracking-tight">Create account</h2>

      <GoogleSignInButton
        onGoogleSignIn={onGoogleSignIn}
        isLoading={isGoogleLoading}
        buttonText="Sign up with Google"
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="signup-first-name" className="block text-sm mb-2">First Name *</Label>
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
            <Label htmlFor="signup-last-name" className="block text-sm mb-2">Last Name *</Label>
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
          <Label htmlFor="signup-mobile" className="block text-sm mb-2">Mobile *</Label>
          <Input
            id="signup-mobile"
            type="tel"
            placeholder="+61 400 000 000"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
          />
        </div>

        <div>
          <Label htmlFor="signup-email" className="block text-sm mb-2">Email *</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
          />
        </div>

        <div>
          <Label htmlFor="signup-password" className="block text-sm mb-2">Password *</Label>
          <Input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-11 rounded-md bg-neutral-800/70 placeholder-neutral-500 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm border-0 text-white"
          />
          <p className="text-xs text-neutral-400 mt-1">Minimum 6 characters</p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm text-neutral-400">I am a... (select all that apply)</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-comedian"
                checked={selectedRoles.includes('comedian')}
                onCheckedChange={() => handleRoleToggle('comedian')}
                className="h-4 w-4 accent-indigo-500"
              />
              <Label htmlFor="is-comedian" className="text-sm cursor-pointer flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Comedian
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-promoter"
                checked={selectedRoles.includes('promoter')}
                onCheckedChange={() => handleRoleToggle('promoter')}
                className="h-4 w-4 accent-indigo-500"
              />
              <Label htmlFor="is-promoter" className="text-sm cursor-pointer flex items-center gap-2">
                <Users className="w-4 h-4" />
                Promoter
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-manager"
                checked={selectedRoles.includes('manager')}
                onCheckedChange={() => handleRoleToggle('manager')}
                className="h-4 w-4 accent-indigo-500"
              />
              <Label htmlFor="is-manager" className="text-sm cursor-pointer flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Manager
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-organization"
                checked={selectedRoles.includes('organization')}
                onCheckedChange={() => handleRoleToggle('organization')}
                className="h-4 w-4 accent-indigo-500"
              />
              <Label htmlFor="is-organization" className="text-sm cursor-pointer flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organization
              </Label>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
    </div>
  );
};

export default SignUpForm;
