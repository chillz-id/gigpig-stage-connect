
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

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur-lg animate-fade-in">
          {/* Centered content container */}
          <div className="flex flex-col h-full max-w-sm mx-auto">
            {/* Main content area */}
            <div className="flex-1 px-6 py-8 overflow-y-auto">
              <MobileUserInfo />
              
              <MobileNavigationLinks
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />

              <MobileThemeControls />

              {!user && (
                <MobileAuthButtons setIsMobileMenuOpen={setIsMobileMenuOpen} />
              )}
            </div>

            {/* Close menu section at bottom */}
            <div className="border-t border-border/20 p-6">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex flex-col items-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors"
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
