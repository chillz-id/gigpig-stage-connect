
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface MobileAuthButtonsProps {
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const MobileAuthButtons: React.FC<MobileAuthButtonsProps> = ({ setIsMobileMenuOpen }) => {
  return (
    <div className="space-y-3 pt-4 border-t border-border">
      <Link to="/auth" className="block">
        <Button
          className="professional-button w-full text-foreground border-border hover:bg-accent transition-all duration-200 rounded-lg h-12 text-base"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Sign In
        </Button>
      </Link>
      <Link to="/auth" className="block">
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 rounded-lg h-12 text-base"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
};

export default MobileAuthButtons;
