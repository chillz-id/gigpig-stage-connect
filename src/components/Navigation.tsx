
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
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
import { cn } from '@/lib/utils';

const Navigation = () => {
  const { user, signOut, hasRole } = useAuth();
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
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/browse', label: 'Browse', icon: Calendar, public: true },
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

  const NavLink: React.FC<{ item: typeof navItems[0], mobile?: boolean }> = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));

    return (
      <Link
        to={item.path}
        onClick={mobile ? closeMobileMenu : undefined}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors min-h-[44px]",
          mobile ? "text-base w-full justify-start" : "text-sm",
          isActive 
            ? "bg-white/20 text-white font-medium" 
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className={mobile ? "block" : "hidden sm:block"}>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-gradient-to-r from-purple-900 to-pink-900 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
              <Drama className="w-6 h-6" />
              <span className="hidden sm:block">Stand Up Sydney</span>
            </Link>

            <div className="flex items-center gap-1">
              {filteredNavItems.slice(0, -2).map((item, index) => (
                <NavLink key={index} item={item} />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {isAdmin && (
                    <NavLink item={navItems.find(item => item.path === '/admin')!} />
                  )}
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 min-h-[44px]"
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
                    className="text-white hover:bg-white/10 min-h-[44px]"
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
      <nav className="md:hidden bg-gradient-to-r from-purple-900 to-pink-900 shadow-lg">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 text-white font-bold">
            <Drama className="w-6 h-6" />
            <span>Stand Up Sydney</span>
          </Link>

          <MobileMenuButton 
            isOpen={isMobileMenuOpen} 
            onToggle={toggleMobileMenu}
          />
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="bg-purple-900/95 backdrop-blur-sm border-t border-white/10">
            <div className="px-4 py-4 space-y-2">
              {filteredNavItems.map((item, index) => (
                <NavLink key={index} item={item} mobile />
              ))}
              
              {user ? (
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 min-h-[44px]"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-white hover:bg-white/10 min-h-[44px]"
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
