
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useUser } from '@/contexts/UserContext';
import CustomerViewToggle from './CustomerViewToggle';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import ThemeControls from './ThemeControls';
import UserProfile from './UserProfile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from './NotificationDropdown';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setViewMode, isMemberView } = useViewMode();
  const { user } = useUser();

  return (
    <nav className="bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo with Customer View Toggle */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center group">
              <img 
                alt="Stand Up Sydney Logo" 
                src="/lovable-uploads/01533f67-2f0b-4cfd-8335-1bb360f481ef.png" 
                className="h-10 w-auto group-hover:opacity-80 transition-all duration-300 object-contain" 
              />
            </Link>
            
            <CustomerViewToggle onViewChange={setViewMode} />
          </div>

          {/* Desktop Navigation */}
          <DesktopNavigation />
          
          {/* Theme Controls and Notifications */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeControls />
            {user && isMemberView && <NotificationDropdown />}
          </div>

          {/* User Info or Auth Buttons */}
          <div className="hidden md:flex">
            <UserProfile />
          </div>

          {/* Mobile Navigation */}
          <MobileNavigation 
            isMobileMenuOpen={isMobileMenuOpen} 
            setIsMobileMenuOpen={setIsMobileMenuOpen} 
          />
        </div>
      </div>
    </nav>
  );
};

export { Navigation };
export default Navigation;
