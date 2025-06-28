
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MobileMenuButton from './mobile/MobileMenuButton';
import MobileNavigationLinks from './mobile/MobileNavigationLinks';
import MobileThemeControls from './mobile/MobileThemeControls';
import MobileAuthButtons from './mobile/MobileAuthButtons';

interface MobileNavigationProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { user } = useAuth();

  return (
    <>
      {/* Hamburger menu button - positioned on far right */}
      <div className="md:hidden">
        <MobileMenuButton 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </div>

      {/* Mobile menu overlay - fixed positioning below header */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[80px] left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/20 min-h-screen">
          <div className="container mx-auto px-6 py-8 space-y-2">
            <MobileNavigationLinks
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <MobileThemeControls />

            {!user && (
              <MobileAuthButtons setIsMobileMenuOpen={setIsMobileMenuOpen} />
            )}

            {/* Close menu section */}
            <div className="border-t border-border/20 px-0 py-6 mt-8">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex flex-col items-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
                <span className="text-sm font-medium">Close Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
