
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, User, Mic, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'customer' | 'comedian' | 'promoter';

const CustomerViewToggle = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('customer');
  const [isToggled, setIsToggled] = useState(false);
  const { hasRole } = useAuth();

  // Only show for admin users
  if (!hasRole('admin')) {
    return null;
  }

  const toggleView = () => {
    setIsToggled(!isToggled);
    
    if (!isToggled) {
      // Cycle through view modes when toggling on
      const modes: ViewMode[] = ['customer', 'comedian', 'promoter'];
      const currentIndex = modes.indexOf(viewMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setViewMode(modes[nextIndex]);
    }
  };

  const getViewIcon = () => {
    switch (viewMode) {
      case 'customer':
        return <User className="w-4 h-4" />;
      case 'comedian':
        return <Mic className="w-4 h-4" />;
      case 'promoter':
        return <Users className="w-4 h-4" />;
    }
  };

  const getViewLabel = () => {
    switch (viewMode) {
      case 'customer':
        return 'Customer View';
      case 'comedian':
        return 'Comedian View';
      case 'promoter':
        return 'Promoter View';
    }
  };

  const getViewColor = () => {
    switch (viewMode) {
      case 'customer':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'comedian':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'promoter':
        return 'bg-green-500 hover:bg-green-600';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleView}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Toggle view mode (Admin only)"
      >
        {isToggled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </Button>
      
      {isToggled && (
        <Badge 
          className={`${getViewColor()} text-white border-0 animate-fade-in`}
          onClick={toggleView}
        >
          <div className="flex items-center gap-1 cursor-pointer">
            {getViewIcon()}
            <span className="text-xs font-medium">{getViewLabel()}</span>
          </div>
        </Badge>
      )}
    </div>
  );
};

export default CustomerViewToggle;
