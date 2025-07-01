
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MagicCard } from '@/components/ui/magic-card';
import { useTheme } from '@/contexts/ThemeContext';

interface FeaturedEventCardProps {
  event: any;
}

export const FeaturedEventCard: React.FC<FeaturedEventCardProps> = ({ event }) => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const getMagicCardColors = () => {
    if (theme === 'pleasure') {
      return {
        gradientColor: "#262626",
        gradientFrom: "#9E7AFF",
        gradientTo: "#FE8BBB"
      };
    }
    return {
      gradientColor: "#404040",
      gradientFrom: "#6B7280",
      gradientTo: "#EF4444"
    };
  };

  const magicColors = getMagicCardColors();

  return (
    <MagicCard 
      className="w-full aspect-[4/3] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:translate-y-[-4px]"
      gradientColor={magicColors.gradientColor}
      gradientFrom={magicColors.gradientFrom}
      gradientTo={magicColors.gradientTo}
    >
      <div 
        className="relative w-full h-full overflow-hidden rounded-2xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {event.banner_url ? (
            <img 
              src={event.banner_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
          )}
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Heart Icon - Top Right */}
        <button
          onClick={handleLikeToggle}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
        >
          <Heart 
            className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white/80 hover:text-white'} transition-colors duration-200`} 
          />
        </button>

        {/* Apply/Applied Text - Top Left (Fade in on hover) */}
        {isIndustryUser && (
          <div 
            className={`absolute top-4 left-4 px-3 py-1.5 text-white text-sm font-medium transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {event.status === 'full' ? 'Full' : 'Apply'}
          </div>
        )}

        {/* Bottom Section - Event Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="space-y-1">
            <h3 className="font-bold text-lg leading-tight">
              {event.title}
            </h3>
            <p className="text-sm opacity-90">
              {formatDate(event.event_date)}
            </p>
          </div>
        </div>
      </div>
    </MagicCard>
  );
};
