
import React from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getComedianProfileImage } from '@/utils/imageOptimization';

interface ComedianAvatarProps {
  name: string | null;
  avatar_url: string | null;
  stage_name?: string | null;
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
}

const ComedianAvatar: React.FC<ComedianAvatarProps> = ({ 
  name, 
  avatar_url, 
  stage_name,
  size = 'large',
  priority = false 
}) => {
  const comedian = { 
    name: name || undefined, 
    avatar_url,
    stage_name: stage_name || undefined
  };
  
  const optimizedSrc = getComedianProfileImage(comedian, size);
  const displayName = stage_name || name || 'Comedian';

  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-muted transition-all duration-300 hover:scale-105 hover:shadow-lg">
      <OptimizedImage
        src={optimizedSrc}
        alt={displayName}
        className="w-full h-full"
        objectFit="cover"
        imageSize={size}
        priority={priority}
        fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=400&background=9333ea&color=ffffff&bold=true`}
        blur
      />
    </div>
  );
};

export default ComedianAvatar;
