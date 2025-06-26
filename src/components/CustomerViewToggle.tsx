
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { User, Mic, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'member' | 'comedian' | 'promoter';

interface CustomerViewToggleProps {
  onViewChange?: (view: ViewMode) => void;
}

const CustomerViewToggle: React.FC<CustomerViewToggleProps> = ({ onViewChange }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('member');
  const { hasRole } = useAuth();

  // Only show for admin users
  if (!hasRole('admin')) {
    return null;
  }

  const handleViewChange = (newView: ViewMode) => {
    setViewMode(newView);
    onViewChange?.(newView);
  };

  const getViewIcon = (view: ViewMode) => {
    switch (view) {
      case 'member':
        return <User className="w-4 h-4" />;
      case 'comedian':
        return <Mic className="w-4 h-4" />;
      case 'promoter':
        return <Users className="w-4 h-4" />;
    }
  };

  const getViewLabel = (view: ViewMode) => {
    switch (view) {
      case 'member':
        return 'Member';
      case 'comedian':
        return 'Comedian';
      case 'promoter':
        return 'Promoter';
    }
  };

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Toggle
        pressed={viewMode === 'member'}
        onPressedChange={() => handleViewChange('member')}
        className={`px-3 py-2 text-xs font-medium transition-all duration-200 ${
          viewMode === 'member'
            ? 'bg-blue-500 text-white hover:bg-blue-600 data-[state=on]:bg-blue-500 data-[state=on]:text-white'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        title="Member View (Customer view)"
      >
        <div className="flex items-center gap-1">
          {getViewIcon('member')}
          <span>{getViewLabel('member')}</span>
        </div>
      </Toggle>
      
      <Toggle
        pressed={viewMode === 'comedian'}
        onPressedChange={() => handleViewChange('comedian')}
        className={`px-3 py-2 text-xs font-medium transition-all duration-200 ${
          viewMode === 'comedian'
            ? 'bg-purple-500 text-white hover:bg-purple-600 data-[state=on]:bg-purple-500 data-[state=on]:text-white'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        title="Comedian View"
      >
        <div className="flex items-center gap-1">
          {getViewIcon('comedian')}
          <span>{getViewLabel('comedian')}</span>
        </div>
      </Toggle>
      
      <Toggle
        pressed={viewMode === 'promoter'}
        onPressedChange={() => handleViewChange('promoter')}
        className={`px-3 py-2 text-xs font-medium transition-all duration-200 ${
          viewMode === 'promoter'
            ? 'bg-green-500 text-white hover:bg-green-600 data-[state=on]:bg-green-500 data-[state=on]:text-white'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
        title="Promoter View"
      >
        <div className="flex items-center gap-1">
          {getViewIcon('promoter')}
          <span>{getViewLabel('promoter')}</span>
        </div>
      </Toggle>
    </div>
  );
};

export default CustomerViewToggle;
