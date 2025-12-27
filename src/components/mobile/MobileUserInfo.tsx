
import React from 'react';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const MobileUserInfo: React.FC = () => {
  const { user, profile, hasRole } = useAuth();

  if (!user || !profile) return null;

  return (
    <div className="flex items-center gap-3 py-4 border-b border-border/50">
      <OptimizedAvatar
        src={profile.avatar_url || ''}
        name={profile.name || user.email || 'User'}
        className="h-12 w-12"
        fallbackClassName="bg-primary/10 text-primary font-semibold"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {profile.name || user.email}
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {hasRole('admin') && (
            <Badge key="admin" variant="secondary" className="text-xs capitalize bg-red-100 text-red-800">
              Admin
            </Badge>
          )}
          {(hasRole('comedian') || hasRole('comedian_lite')) && (
            <Badge key="comedian" variant="secondary" className="text-xs capitalize bg-blue-100 text-blue-800">
              {hasRole('comedian_lite') ? 'Comedian Lite' : 'Comedian'}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileUserInfo;
