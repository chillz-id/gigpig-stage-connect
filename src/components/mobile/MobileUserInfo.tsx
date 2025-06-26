
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface MobileUserInfoProps {
  user: any;
  isMemberView: boolean;
  isComedianView: boolean;
}

const MobileUserInfo: React.FC<MobileUserInfoProps> = ({
  user,
  isMemberView,
  isComedianView,
}) => {
  if (!user) return null;

  return (
    <div className="flex items-center space-x-3 pb-4 border-b border-border">
      <img
        src={user.avatar}
        alt={user.name}
        className="w-12 h-12 rounded-full border-2 border-border"
      />
      <div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm">{user.name}</span>
          {user.isVerified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
        </div>
        <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
          {isMemberView ? 'MEMBER' : isComedianView ? 'COMEDIAN' : 'USER'}
        </Badge>
      </div>
    </div>
  );
};

export default MobileUserInfo;
