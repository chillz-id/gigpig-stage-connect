
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import ThemeControls from './ThemeControls';
import UserProfile from './UserProfile';
import { NotificationDropdown } from './NotificationDropdown';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  return (
    <>
      {/* Fixed header that stays on top */}
      <nav className="bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 transition-all duration-300 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo - Always visible on left */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img 
                  alt="Stand Up Sydney Logo" 
                  src="/lovable-uploads/a9e0c15c-d6e1-430b-9849-b4953d9fb4b7.png" 
                  className="h-12 sm:h-14 w-auto group-hover:opacity-80 transition-all duration-300 object-contain" 
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <DesktopNavigation />
            
            {/* Theme Controls and Notifications - Desktop only */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeControls />
              {user && <NotificationDropdown />}
            </div>

            {/* User Info or Auth Buttons - Desktop only */}
            <div className="hidden md:flex">
              <UserProfile />
            </div>

            {/* Mobile hamburger menu button - Always visible on far right */}
            <MobileNavigation 
              isMobileMenuOpen={isMobileMenuOpen} 
              setIsMobileMenuOpen={setIsMobileMenuOpen} 
            />
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay - positioned below the fixed header */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[80px] left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/20">
          <div className="container mx-auto px-4 py-6 space-y-2">
            {/* Mobile navigation content will be rendered here */}
          </div>
        </div>
      )}
    </>
  );
};

export { Navigation };
export default Navigation;
