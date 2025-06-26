
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useUser } from '@/contexts/UserContext';
import CustomerViewToggle from './CustomerViewToggle';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import ThemeControls from './ThemeControls';
import UserProfile from './UserProfile';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setViewMode } = useViewMode();
  const { user } = useUser();

  return (
    <nav className="bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo with text and Customer View Toggle */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                alt="Stand Up Sydney Logo"
                src="/lovable-uploads/01533f67-2f0b-4cfd-8335-1bb360f481ef.png"
                className="h-10 w-auto group-hover:opacity-80 transition-all duration-300 object-contain"
              />
              <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                Stand Up Sydney
              </span>
            </Link>
            
            <CustomerViewToggle onViewChange={setViewMode} />
          </div>

          {/* Desktop Navigation */}
          <DesktopNavigation />
          
          {/* Theme Controls */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeControls />
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
