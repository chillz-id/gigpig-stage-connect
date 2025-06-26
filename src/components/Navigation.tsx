
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useUser } from '@/contexts/UserContext';
import CustomerViewToggle from './CustomerViewToggle';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import ThemeControls from './ThemeControls';
import UserProfile from './UserProfile';
import { NotificationDropdown } from './NotificationDropdown';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setViewMode, isMemberView } = useViewMode();
  const { user } = useUser();

  return (
    <nav className="bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo with Customer View Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="flex items-center group">
              <img 
                alt="Stand Up Sydney Logo" 
                src="/lovable-uploads/01533f67-2f0b-4cfd-8335-1bb360f481ef.png" 
                className="h-8 sm:h-10 w-auto group-hover:opacity-80 transition-all duration-300 object-contain" 
              />
            </Link>
            
            <div className="hidden sm:block">
              <CustomerViewToggle onViewChange={setViewMode} />
            </div>
          </div>

          {/* Desktop Navigation */}
          <DesktopNavigation />
          
          {/* Theme Controls and Notifications - Desktop only */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeControls />
            {user && isMemberView && <NotificationDropdown />}
          </div>

          {/* User Info or Auth Buttons - Desktop only */}
          <div className="hidden md:flex">
            <UserProfile />
          </div>

          {/* Mobile Navigation */}
          <MobileNavigation 
            isMobileMenuOpen={isMobileMenuOpen} 
            setIsMobileMenuOpen={setIsMobileMenuOpen} 
          />
        </div>

        {/* Mobile Customer View Toggle */}
        <div className="sm:hidden pb-3 border-b border-border">
          <CustomerViewToggle onViewChange={setViewMode} />
        </div>
      </div>
    </nav>
  );
};

export { Navigation };
export default Navigation;
