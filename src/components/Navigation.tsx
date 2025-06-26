
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useViewMode } from '@/contexts/ViewModeContext';
import CustomerViewToggle from './CustomerViewToggle';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import ThemeControls from './ThemeControls';
import UserProfile from './UserProfile';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setViewMode } = useViewMode();

  return (
    <nav className="bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo with Customer View Toggle */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-primary-foreground font-bold text-lg">GP</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">GigPig</h1>
            </Link>
            
            <CustomerViewToggle onViewChange={setViewMode} />
          </div>

          {/* Desktop Navigation */}
          <DesktopNavigation />
          
          {/* Theme Controls */}
          <div className="hidden md:flex">
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
