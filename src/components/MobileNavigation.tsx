
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MobileMenuButton from './mobile/MobileMenuButton';
import MobileUserInfo from './mobile/MobileUserInfo';
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
      <MobileMenuButton 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Mobile menu that pushes content down */}
      <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
        isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-background/95 backdrop-blur-lg border-b border-border/20">
          {/* Add significant top spacing to push content to middle */}
          <div className="pt-16 px-6 pb-6 space-y-2">
            <MobileNavigationLinks
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <MobileThemeControls />

            {!user && (
              <MobileAuthButtons setIsMobileMenuOpen={setIsMobileMenuOpen} />
            )}
          </div>

          {/* Close menu section */}
          <div className="border-t border-border/20 px-6 py-4">
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
    </>
  );
};

export default MobileNavigation;
