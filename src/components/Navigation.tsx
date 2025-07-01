
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Home, 
  Calendar, 
  User, 
  PlusCircle, 
  FileText, 
  Settings, 
  LogOut, 
  Drama,
  Crown
} from 'lucide-react';
import MobileMenuButton from './MobileMenuButton';
import ThemeToggle from './ThemeToggle';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const { user, signOut, hasRole } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMobileMenuOpen(false);
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Sign out error", 
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isAdmin = hasRole('admin');
  const isPromoter = hasRole('promoter') || isAdmin;

  const navItems = [
    { path: '/browse', label: 'Shows', icon: Calendar, public: true },
    { path: '/dashboard', label: 'Dashboard', icon: User, protected: true },
    { path: '/profile', label: 'Profile', icon: User, protected: true },
    { path: '/create-event', label: 'Create Event', icon: PlusCircle, roles: ['promoter', 'admin'] },
    { path: '/applications', label: 'Applications', icon: FileText, roles: ['promoter', 'admin'] },
    { path: '/invoices', label: 'Invoices', icon: FileText, roles: ['promoter', 'admin'] },
    { path: '/admin', label: 'Admin', icon: Crown, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.public) return true;
    if (item.protected && !user) return false;
    if (item.roles) {
      return item.roles.some(role => hasRole(role as any));
    }
    return user ? true : false;
  });

  const getNavStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-r from-pink-700/90 via-purple-600/90 to-purple-800/90 backdrop-blur-md border-b border-white/10';
    }
    return 'bg-gradient-to-r from-gray-800 via-gray-900 to-red-900/30 border-b border-gray-700';
  };

  const NavLink: React.FC<{ item: typeof navItems[0], mobile?: boolean }> = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));

    const getLinkStyles = () => {
      const baseStyles = "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px]";
      const mobileStyles = mobile ? "text-base w-full justify-start" : "text-sm";
      
      if (theme === 'pleasure') {
        return cn(
          baseStyles,
          mobileStyles,
          isActive 
            ? "bg-white/20 text-white font-medium backdrop-blur-md border border-white/30" 
            : "text-white/80 hover:bg-white/10 hover:text-white hover:backdrop-blur-md"
        );
      } else {
        return cn(
          baseStyles,
          mobileStyles,
          isActive 
            ? "bg-gray-700 text-red-400 font-medium border border-red-500/30" 
            : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
        );
      }
    };

    return (
      <Link
        to={item.path}
        onClick={mobile ? closeMobileMenu : undefined}
        className={getLinkStyles()}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className={mobile ? "block" : "hidden sm:block"}>{item.label}</span>
      </Link>
    );
  };

  const getButtonStyles = (variant: 'primary' | 'ghost' = 'ghost') => {
    if (theme === 'pleasure') {
      return variant === 'primary' 
        ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 min-h-[44px]"
        : "text-white hover:bg-white/10 hover:backdrop-blur-md min-h-[44px]";
    } else {
      return variant === 'primary'
        ? "bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
        : "text-gray-300 hover:bg-gray-700/50 hover:text-white min-h-[44px]";
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={cn("hidden md:flex shadow-lg", getNavStyles())}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/browse" className="flex items-center gap-2 text-white font-bold text-lg">
              <Drama className="w-6 h-6" />
              <span className="hidden sm:block">Stand Up Sydney</span>
            </Link>

            <div className="flex items-center gap-1">
              {filteredNavItems.slice(0, -2).map((item, index) => (
                <NavLink key={index} item={item} />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {user ? (
                <>
                  {isAdmin && (
                    <NavLink item={navItems.find(item => item.path === '/admin')!} />
                  )}
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className={getButtonStyles('ghost')}
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:block">Sign Out</span>
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={getButtonStyles('primary')}
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className={cn("md:hidden shadow-lg", getNavStyles())}>
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/browse" className="flex items-center gap-2 text-white font-bold">
            <Drama className="w-6 h-6" />
            <span>Stand Up Sydney</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MobileMenuButton 
              isOpen={isMobileMenuOpen} 
              onToggle={toggleMobileMenu}
            />
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className={theme === 'pleasure' 
            ? "bg-purple-900/95 backdrop-blur-sm border-t border-white/10" 
            : "bg-gray-900/95 backdrop-blur-sm border-t border-gray-700"
          }>
            <div className="px-4 py-4 space-y-2">
              {filteredNavItems.map((item, index) => (
                <NavLink key={index} item={item} mobile />
              ))}
              
              {user ? (
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className={cn("w-full justify-start", getButtonStyles('ghost'))}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button 
                    variant="ghost" 
                    className={cn("w-full justify-start", getButtonStyles('primary'))}
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navigation;
