
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MobileUserInfoProps {
  user: any;
}

const MobileUserInfo: React.FC<MobileUserInfoProps> = ({ user }) => {
  if (!user) return null;

  return (
    <div className="flex items-center gap-3 py-4 border-b border-border/50">
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {user.name || user.email}
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {user.roles?.map((role: string) => (
            <Badge key={role} variant="secondary" className="text-xs capitalize">
              {role}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileUserInfo;
