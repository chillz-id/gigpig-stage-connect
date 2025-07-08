import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Calendar1, 
  Drama, 
  FileUser, 
  LogOut, 
  Bell,
  Settings,
  MessageCircle,
  BarChart3,
  Plus,
  Palette,
  Camera
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { Dock, DockIcon } from '@/components/ui/dock';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DockNavigation = () => {
  const { user, signOut, hasRole } = useAuth();
  const { theme } = useTheme();
  const { profile } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [showMobileLogo, setShowMobileLogo] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show logo when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setShowMobileLogo(true);
      } else {
        setShowMobileLogo(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const getIconClass = (path: string) => {
    const isCurrentPath = isActive(path);
    return cn(
      "transition-all duration-200",
      isCurrentPath 
        ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
        : "text-white hover:drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]"
    );
  };

  const getDockClass = () => {
    return "bg-black/50 backdrop-blur-xl border-white/10";
  };

  const getDockIconClass = (path: string) => {
    const isCurrentPath = isActive(path);
    return cn(
      "transition-all duration-200 hover:bg-red-500/20",
      isCurrentPath && "bg-white/10"
    );
  };

  if (!user) {
    return null;
  }

  const navigationItems = [
    { path: '/shows', icon: Calendar1, label: 'Shows', show: true },
    { path: '/comedians', icon: Drama, label: 'Comedians', show: true },
    { path: '/photographers', icon: Camera, label: 'Photographers', show: true },
    { path: '/dashboard', icon: BarChart3, label: 'Dashboard', show: true },
    { path: '/applications', icon: FileUser, label: 'Applications', show: hasRole('promoter') || hasRole('admin') },
    { path: '/messages', icon: MessageCircle, label: 'Messages', show: true },
    { path: '/notifications', icon: Bell, label: 'Notifications', show: true, badge: unreadCount },
    { path: '/create-event', icon: Plus, label: 'New Event', show: true },
    { path: '/admin', icon: Settings, label: 'Admin', show: hasRole('admin') },
    { path: '/profile', icon: null, label: 'Profile', show: true, isProfile: true },
  ];

  return (
    <>
      {/* Logo for desktop */}
      <div className="fixed top-4 left-4 z-50 hidden md:block">
        <Link to="/" className="flex items-center">
          <img 
            src="/id-logo.png" 
            alt="Stand Up Sydney" 
            className="h-12 w-auto"
          />
        </Link>
      </div>

      {/* Logo for mobile - centered at top */}
      <div className={cn(
        "md:hidden transition-all duration-300",
        showMobileLogo ? "h-24" : "h-0 overflow-hidden"
      )}>
        <Link to="/" className="flex items-center justify-center pt-4 pb-2">
          <img 
            src="/id-logo.png" 
            alt="Stand Up Sydney" 
            className="h-16 w-auto"
          />
        </Link>
      </div>

      {/* Desktop Dock Navigation */}
      <div className="fixed bottom-8 left-0 right-0 z-50 hidden md:block">
        <TooltipProvider>
          <Dock 
            className={getDockClass()}
            iconSize={40}
            iconMagnification={60}
            iconDistance={100}
          >
            {navigationItems.filter(item => item.show).map((item) => (
              <DockIcon key={item.path} className={getDockIconClass(item.path)}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={item.path} className="relative block w-full h-full flex items-center justify-center">
                      {item.isProfile ? (
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-600">
                          {profile?.photo_url ? (
                            <img 
                              src={profile.photo_url} 
                              alt={profile.name || 'Profile'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium">
                              {profile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <item.icon className={cn("size-full", getIconClass(item.path))} />
                          {item.badge && item.badge > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center animate-pulse"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            ))}
            
            {/* Sign Out */}
            <DockIcon className={getDockIconClass('/signout')}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleSignOut}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <LogOut className={cn("size-full", getIconClass('/signout'))} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Sign Out</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          </Dock>
        </TooltipProvider>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden border-t",
        "bg-black/90 backdrop-blur-xl border-white/10"
      )}>
        <div className="flex overflow-x-auto scrollbar-hide py-2 px-4 gap-4">
          {navigationItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] py-2 relative",
                isActive(item.path) && "text-white",
                !isActive(item.path) && "text-gray-400"
              )}
            >
              {item.isProfile ? (
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-600">
                  {profile?.photo_url ? (
                    <img 
                      src={profile.photo_url} 
                      alt={profile.name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-medium">
                      {profile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              ) : (
                <item.icon className="w-5 h-5" />
              )}
              <span className="text-[10px] mt-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 text-[10px] p-0 flex items-center justify-center"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center min-w-[60px] py-2 text-gray-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] mt-1">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default DockNavigation;