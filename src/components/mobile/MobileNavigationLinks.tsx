
import React from 'react';
import { Link } from 'react-router-dom';

interface MobileNavigationLinksProps {
  user: any;
  isMemberView: boolean;
  isComedianView: boolean;
  hasRole: (role: string) => boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const MobileNavigationLinks: React.FC<MobileNavigationLinksProps> = ({
  user,
  isMemberView,
  isComedianView,
  hasRole,
  setIsMobileMenuOpen,
}) => {
  const navigationLinks = [
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
  ];

  return (
    <div className="space-y-2">
      {navigationLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-accent text-base"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
};

export default MobileNavigationLinks;
