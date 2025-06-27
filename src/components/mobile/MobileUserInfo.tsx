
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const MobileUserInfo: React.FC = () => {
  const { user, profile, hasRole } = useAuth();

  if (!user || !profile) return null;

  return (
    <div className="flex items-center gap-3 py-4 border-b border-border/50">
      <Avatar className="h-12 w-12">
        <AvatarImage src={profile.avatar_url || ''} alt={profile.name || ''} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {profile.name ? profile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
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
          {hasRole('promoter') && (
            <Badge key="promoter" variant="secondary" className="text-xs capitalize bg-purple-100 text-purple-800">
              Promoter
            </Badge>
          )}
          {hasRole('comedian') && (
            <Badge key="comedian" variant="secondary" className="text-xs capitalize bg-blue-100 text-blue-800">
              Comedian
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileUserInfo;
