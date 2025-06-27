
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Calendar, Users, MessageCircle, Bell, Plus, Crown, User, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MobileNavigationLinksProps {
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const MobileNavigationLinks: React.FC<MobileNavigationLinksProps> = ({
  setIsMobileMenuOpen,
}) => {
  const { user, hasRole } = useAuth();

  // Admin should have access to everything
  const isAdmin = hasRole('admin');
  const isPromoter = hasRole('promoter') || isAdmin;
  const isComedian = hasRole('comedian') || isAdmin;

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="space-y-2 py-4">
      {/* Main Navigation */}
      <Link
        to="/browse"
        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
        onClick={handleLinkClick}
      >
        <Home className="w-5 h-5" />
        <span>Shows</span>
      </Link>

      <Link
        to="/comedians"
        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
        onClick={handleLinkClick}
      >
        <Users className="w-5 h-5" />
        <span>Comedians</span>
      </Link>

      {/* Authenticated User Links */}
      {user && (
        <>
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
            onClick={handleLinkClick}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/profile?tab=calendar"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
            onClick={handleLinkClick}
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </Link>

          <Link
            to="/notifications"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
            onClick={handleLinkClick}
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </Link>

          <Link
            to="/messages"
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
            onClick={handleLinkClick}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Messages</span>
          </Link>

          {/* Admin Dashboard - Always visible for admins */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
              onClick={handleLinkClick}
            >
              <Crown className="w-5 h-5 text-yellow-400" />
              <span>Admin Dashboard</span>
            </Link>
          )}

          {/* Create Event for promoters/admins - Admin should always see this */}
          {isPromoter && (
            <Link
              to="/create-event"
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
              onClick={handleLinkClick}
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </Link>
          )}
        </>
      )}

      {/* Book Comedian for non-authenticated users */}
      {!user && (
        <Link
          to="/auth"
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-colors"
          onClick={handleLinkClick}
        >
          <User className="w-5 h-5" />
          <span>Book Comedian</span>
        </Link>
      )}
    </div>
  );
};

export default MobileNavigationLinks;
