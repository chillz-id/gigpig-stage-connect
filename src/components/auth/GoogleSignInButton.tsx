
import React from 'react';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';

interface GoogleSignInButtonProps {
  onGoogleSignIn: () => Promise<void>;
  isLoading: boolean;
  buttonText: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onGoogleSignIn,
  isLoading,
  buttonText,
}) => {
  return (
    <Button
      onClick={onGoogleSignIn}
      disabled={isLoading}
      className="w-full h-11 flex items-center justify-center gap-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white ring-1 ring-neutral-700/60 font-medium text-sm"
      variant="outline"
    >
      <Chrome className="w-5 h-5" />
      <span>{isLoading ? buttonText.replace('Continue', 'Signing in').replace('Sign up', 'Signing up') + '...' : buttonText}</span>
    </Button>
  );
};

export default GoogleSignInButton;
