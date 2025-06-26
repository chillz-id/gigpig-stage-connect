
import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useViewMode } from '@/contexts/ViewModeContext';
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
  const { user } = useUser();
  const { isMemberView, isComedianView } = useViewMode();

  const hasRole = (role: string) => {
    return user?.roles?.includes(role as any) || false;
  };

  return (
    <>
      <MobileMenuButton 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {isMobileMenuOpen && (
        <div className="md:hidden pb-6 space-y-4 text-foreground animate-fade-in bg-background/95 backdrop-blur-lg border-t border-border">
          <div className="px-4 py-2">
            <MobileUserInfo 
              user={user}
              isMemberView={isMemberView}
              isComedianView={isComedianView}
            />
            
            <MobileNavigationLinks
              user={user}
              isMemberView={isMemberView}
              isComedianView={isComedianView}
              hasRole={hasRole}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            <MobileThemeControls />

            {!user && (
              <MobileAuthButtons setIsMobileMenuOpen={setIsMobileMenuOpen} />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
