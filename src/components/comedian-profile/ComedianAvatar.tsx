
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
    <Avatar className="w-full h-full">
      <AvatarImage 
        src={avatar_url || 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=400&fit=crop&crop=face'} 
        alt={name || 'Comedian'} 
        className="object-cover"
      />
      <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default ComedianAvatar;
