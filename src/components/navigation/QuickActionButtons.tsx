
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, Calendar, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionButtonsProps {
  user: any;
  isMemberView: boolean;
  isComedianView: boolean;
  hasRole: (role: string) => boolean;
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({ 
  user, 
  isMemberView, 
  isComedianView, 
  hasRole 
}) => {
  if (!user || isMemberView) return null;

  return (
    <div className="flex items-center space-x-3">
      {/* Calendar icon with blinking dot for comedian view */}
      {isComedianView && (
        <Link to="/profile?tab=calendar">
          <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 rounded-lg">
            <Calendar className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </Button>
        </Link>
      )}
      <Link to="/notifications">
        <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 rounded-lg">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        </Button>
      </Link>
      <Link to="/messages">
        <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent hover:text-accent-foreground relative transition-all duration-200 rounded-lg">
          <MessageCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
        </Button>
      </Link>
      {/* Hide Create Event for comedian view */}
      {(hasRole('promoter') || hasRole('admin')) && !isComedianView && (
        <Link to="/create-event">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            Event
          </Button>
        </Link>
      )}
    </div>
  );
};

export default QuickActionButtons;
