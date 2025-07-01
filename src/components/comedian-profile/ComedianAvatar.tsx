
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ComedianAvatarProps {
  name: string | null;
  avatar_url: string | null;
}

const ComedianAvatar: React.FC<ComedianAvatarProps> = ({ name, avatar_url }) => {
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Avatar className="w-32 h-32">
      <AvatarImage src={avatar_url || ''} alt={name || 'Comedian'} />
      <AvatarFallback className="text-2xl font-bold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default ComedianAvatar;
