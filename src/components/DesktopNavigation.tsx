
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, Calendar, Plus, Crown, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DesktopNavigation: React.FC = () => {
  const { user, hasRole } = useAuth();

  return (
    <div className="hidden md:flex items-center space-x-6">
      {/* Main Navigation Links */}
      <div className="flex items-center space-x-6">
        <Link 
          to="/browse" 
          className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
        >
          Shows
        </Link>
        <Link 
          to="/comedians" 
          className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
        >
          Comedians
        </Link>
        {user && (
          <Link 
            to="/dashboard" 
            className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
          >
            Dashboard
          </Link>
        )}
      </div>

      {/* Action Buttons for authenticated users */}
      {user && (
        <div className="flex items-center space-x-3">
          {/* Admin Dashboard link */}
          {hasRole('admin') && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-400" />
              </Button>
            </Link>
          )}
          
          {/* Calendar */}
          <Link to="/profile?tab=calendar">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 rounded-lg">
              <Calendar className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </Button>
          </Link>

          {/* Notifications */}
          <Link to="/notifications">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </Button>
          </Link>

          {/* Messages */}
          <Link to="/messages">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 rounded-lg">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </Button>
          </Link>

          {/* Create Event for promoters/admins */}
          {(hasRole('promoter') || hasRole('admin')) && (
            <Link to="/create-event">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Event
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Book Comedian button for non-authenticated users */}
      {!user && (
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
            <User className="w-4 h-4 mr-2" />
            Book Comedian
          </Button>
        </Link>
      )}
    </div>
  );
};

export default DesktopNavigation;
