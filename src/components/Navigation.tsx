
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
  Plus,
  Palette,
  Building2,
  Lightbulb,
  Bug
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import MobileNavigation from './MobileNavigation';
import ThemeControls from './ThemeControls';
import { MobileBottomNav, MobileDrawer } from '@/components/mobile';

const Navigation = () => {
  const { user, signOut, hasRole } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

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
        "fixed top-0 left-0 right-0 z-50 border-b dynamic-blur shadow-lg",
        theme === 'pleasure' 
          ? 'bg-purple-800/90 border-purple-600/30' 
          : 'bg-gray-800/95 border-gray-600/40'
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/id-logo.png" 
                alt="Stand Up Sydney" 
                className="h-12 w-auto"
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              <Link to="/gigs" className={getNavLinkClass('/gigs')} title="Gigs">
                <Search className="w-4 h-4" />
              </Link>

              <Link to="/comedians" className={getNavLinkClass('/comedians')} title="Comedians">
                <Users className="w-4 h-4" />
              </Link>

              <Link to="/dashboard" className={getNavLinkClass('/dashboard')} title="Dashboard">
                <BarChart3 className="w-4 h-4" />
              </Link>

              {(hasRole('comedian') || hasRole('comedian_lite')) && (
                <Link to="/applications" className={getNavLinkClass('/applications')} title="Applications">
                  <Calendar className="w-4 h-4" />
                </Link>
              )}

              {(hasRole('admin')) && (
                <Link to="/agency" className={getNavLinkClass('/agency')} title="Agency Management">
                  <Building2 className="w-4 h-4" />
                </Link>
              )}

              <Link to="/messages" className={getNavLinkClass('/messages')} title="Messages">
                <MessageCircle className="w-4 h-4" />
              </Link>

              <Link to="/notifications" className={cn(getNavLinkClass('/notifications'), "relative")} title="Notifications">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center animate-blink animate-pulse-notification"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Link>

              <Link to="/roadmap" className={getNavLinkClass('/roadmap')} title="Feature Roadmap">
                <Lightbulb className="w-4 h-4" />
              </Link>

              <Link to="/bugs" className={getNavLinkClass('/bugs')} title="Bug Tracker">
                <Bug className="w-4 h-4" />
              </Link>

              {hasRole('admin') && (
                <Link to="/admin" className={getNavLinkClass('/admin')} title="Admin">
                  <Settings className="w-4 h-4" />
                </Link>
              )}

              {hasRole('admin') && (
                <Link to="/design-system" className={getNavLinkClass('/design-system')} title="Design System">
                  <Palette className="w-4 h-4" />
                </Link>
              )}

              {user && (
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
                className="professional-button"
                size="sm"
                className={cn("ml-2", getButtonClass())}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              className="professional-button"
              size="sm"
              className={cn("md:hidden", getButtonClass())}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation (Hamburger Menu) */}
      <MobileNavigation
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onMoreClick={() => setIsMoreDrawerOpen(true)}
        notificationCounts={{ applications: unreadCount }}
      />

      {/* Mobile More Drawer */}
      <MobileDrawer
        open={isMoreDrawerOpen}
        onOpenChange={setIsMoreDrawerOpen}
        title="More Options"
      >
        <nav className="space-y-2">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
            onClick={() => setIsMoreDrawerOpen(false)}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
          {hasRole(['admin']) && (
            <Link
              to="/admin"
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
              onClick={() => setIsMoreDrawerOpen(false)}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Admin Dashboard</span>
            </Link>
          )}
          {hasRole(['admin', 'agency_manager']) && (
            <Link
              to="/crm"
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
              onClick={() => setIsMoreDrawerOpen(false)}
            >
              <Users className="h-5 w-5" />
              <span>CRM</span>
            </Link>
          )}
          <Link
            to="/messages"
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent"
            onClick={() => setIsMoreDrawerOpen(false)}
          >
            <MessageCircle className="h-5 w-5" />
            <span>Messages</span>
          </Link>
          <button
            onClick={() => {
              setIsMoreDrawerOpen(false);
              handleSignOut();
            }}
            className="flex w-full items-center gap-3 rounded-lg p-3 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </nav>
      </MobileDrawer>

      {/* Spacer for fixed navigation */}
      <div className="h-20 md:h-20" /> {/* Extra space on mobile for bottom nav */}
    </>
  );
};

export default Navigation;
