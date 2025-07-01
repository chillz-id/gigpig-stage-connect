
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Search, 
  User, 
  LogOut, 
  Bell,
  Settings,
  Menu,
  X,
  Users,
  MessageCircle,
  BarChart3,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import MobileNavigation from './MobileNavigation';
import ThemeControls from './ThemeControls';

const Navigation = () => {
  const { user, signOut, hasRole } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const getNavLinkClass = (path: string) => {
    const baseClass = "flex items-center justify-center p-2 rounded-lg transition-all duration-200 text-sm font-medium w-10 h-10";
    const activeClass = theme === 'pleasure' 
      ? 'bg-purple-600/80 text-white shadow-lg' 
      : 'bg-gray-700/80 text-white shadow-lg';
    const inactiveClass = theme === 'pleasure'
      ? 'text-purple-100 hover:bg-purple-700/50 hover:text-white'
      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white';
    
    return cn(baseClass, isActive(path) ? activeClass : inactiveClass);
  };

  const getButtonClass = () => {
    return theme === 'pleasure'
      ? 'bg-purple-600/80 hover:bg-purple-700/80 text-white border-purple-500/50'
      : 'bg-gray-700/80 hover:bg-gray-600/80 text-white border-gray-600/50';
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md shadow-lg",
        theme === 'pleasure' 
          ? 'bg-purple-800/90 border-purple-600/30' 
          : 'bg-gray-800/95 border-gray-600/40'
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                theme === 'pleasure' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-white'
              )}>
                SUS
              </div>
              <span className="font-bold text-lg text-white hidden sm:block">
                Stand Up Sydney
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              <Link to="/shows" className={getNavLinkClass('/shows')} title="Shows">
                <Search className="w-4 h-4" />
              </Link>

              <Link to="/comedians" className={getNavLinkClass('/comedians')} title="Comedians">
                <Users className="w-4 h-4" />
              </Link>

              <Link to="/dashboard" className={getNavLinkClass('/dashboard')} title="Dashboard">
                <BarChart3 className="w-4 h-4" />
              </Link>

              {hasRole('comedian') && (
                <Link to="/applications" className={getNavLinkClass('/applications')} title="Applications">
                  <Calendar className="w-4 h-4" />
                </Link>
              )}

              <Link to="/messages" className={getNavLinkClass('/messages')} title="Messages">
                <MessageCircle className="w-4 h-4" />
              </Link>

              <Link to="/notifications" className={cn(getNavLinkClass('/notifications'), "relative")} title="Notifications">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Link>

              {hasRole('admin') && (
                <Link to="/admin" className={getNavLinkClass('/admin')} title="Admin">
                  <Settings className="w-4 h-4" />
                </Link>
              )}

              {(hasRole('promoter') || hasRole('admin')) && (
                <Link to="/create-event" className={getNavLinkClass('/create-event')} title="Create Event">
                  <Plus className="w-4 h-4" />
                </Link>
              )}

              <Link to="/profile" className={getNavLinkClass('/profile')} title="Profile">
                <User className="w-4 h-4" />
              </Link>

              <ThemeControls />

              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className={cn("ml-2", getButtonClass())}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="sm"
              className={cn("md:hidden", getButtonClass())}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNavigation 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      {/* Spacer for fixed navigation */}
      <div className="h-16" />
    </>
  );
};

export default Navigation;
