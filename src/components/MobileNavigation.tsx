import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Star, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useTheme } from '@/contexts/ThemeContext';

interface MobileNavigationProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { isMemberView, isComedianView } = useViewMode();

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Helper function to check if user has a specific role
  const hasRole = (role: string) => {
    return user?.roles?.includes(role as any) || false;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden pb-6 space-y-4 text-foreground animate-fade-in bg-background/95 backdrop-blur-lg border-t border-border">
          {/* User info on mobile */}
          {user && (
            <div className="flex items-center space-x-3 pb-4 border-b border-border">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full border-2 border-border"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{user.name}</span>
                  {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                </div>
                <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
                  {isMemberView ? 'MEMBER' : isComedianView ? 'COMEDIAN' : 'USER'}
                </Badge>
              </div>
            </div>
          )}

          {/* Mobile navigation links */}
          {[
            // Always show Browse Shows
            { to: '/browse', label: 'Browse Shows' },
            // Show Invoices for comedian view
            ...(isComedianView ? [{ to: '/invoices', label: 'Invoices' }] : []),
            // Always show Comedians
            { to: '/comedians', label: 'Comedians' },
            // Show Dashboard for comedian view
            ...(isComedianView ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
            // Show Calendar for non-member views only
            ...(!isMemberView ? [{ to: '/profile?tab=calendar', label: 'Calendar' }] : []),
            // Show Book Comedian for member view
            ...(isMemberView ? [{ to: user ? '/profile?tab=book-comedian' : '/auth', label: 'Book Comedian' }] : []),
            // Only show Dashboard for non-member views and non-comedian views
            ...(!isMemberView && !isComedianView ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
            // Only show promoter-specific items for actual promoters/admins AND not in comedian view
            ...((hasRole('promoter') || hasRole('admin')) && !isComedianView ? [
              { to: '/create-event', label: 'Create Event' },
              { to: '/invoices', label: 'Invoices' }
            ] : []),
            { to: '/profile', label: 'Profile' },
            // Only show messages and notifications for non-member views
            ...(!isMemberView ? [
              { to: '/messages', label: 'Messages' },
              { to: '/notifications', label: 'Notifications' }
            ] : [])
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200 py-2 px-1 rounded-lg hover:bg-accent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center space-x-3">
              <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleDarkMode}
                className="data-[state=checked]:bg-primary"
              />
              <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">Dark Mode</span>
            </div>
          </div>

          {!user && (
            <div className="space-y-3 pt-3 border-t border-border">
              <Link to="/auth">
                <Button
                  variant="outline"
                  className="w-full text-foreground border-border hover:bg-accent transition-all duration-200 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
