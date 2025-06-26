
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useViewMode } from '@/contexts/ViewModeContext';

const DesktopNavigation: React.FC = () => {
  const { user } = useUser();
  const { isMemberView } = useViewMode();

  // Helper function to check if user has a specific role
  const hasRole = (role: string) => {
    return user?.roles?.includes(role as any) || false;
  };

  return (
    <div className="hidden md:flex items-center space-x-8">
      <Link 
        to="/browse" 
        className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
      >
        Browse Shows
      </Link>
      
      <Link 
        to="/comedians" 
        className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
      >
        Comedians
      </Link>
      
      <Link 
        to="/calendar" 
        className="flex items-center gap-1 text-foreground hover:text-primary transition-colors duration-200 font-medium"
      >
        <Calendar className="w-4 h-4" />
        Calendar
      </Link>

      {isMemberView && (
        <Link 
          to={user ? '/profile?tab=book-comedian' : '/auth'}
          className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
        >
          Book Comedian
        </Link>
      )}

      {!isMemberView && (
        <Link 
          to="/dashboard" 
          className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
        >
          Dashboard
        </Link>
      )}

      {(hasRole('promoter') || hasRole('admin')) && (
        <>
          <Link 
            to="/create-event" 
            className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
          >
            Create Event
          </Link>
          <Link 
            to="/applications" 
            className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
          >
            Applications
          </Link>
          <Link 
            to="/invoices" 
            className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
          >
            Invoices
          </Link>
        </>
      )}

      <Link 
        to="/profile" 
        className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
      >
        Profile
      </Link>

      {!isMemberView && (
        <>
          <Link 
            to="/messages" 
            className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
          >
            Messages
          </Link>
          <Link 
            to="/notifications" 
            className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
          >
            Notifications
          </Link>
        </>
      )}
    </div>
  );
};

export default DesktopNavigation;
