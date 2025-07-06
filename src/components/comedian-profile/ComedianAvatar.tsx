
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
    <div className="w-full h-full rounded-lg overflow-hidden bg-muted transition-all duration-300 hover:scale-105 hover:shadow-lg">
      <img 
        src={avatar_url || 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=400&fit=crop&crop=face'} 
        alt={name || 'Comedian'} 
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLDivElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white text-4xl font-bold" style={{ display: 'none' }}>
        {getInitials(name)}
      </div>
    </div>
  );
};

export default ComedianAvatar;
