
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface FeaturedEventCardProps {
  event: any;
}

export const FeaturedEventCard: React.FC<FeaturedEventCardProps> = ({ event }) => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const { day, month } = formatDate(event.event_date);

  return (
    <div 
      className="relative w-full aspect-[4/3] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:translate-y-[-4px] bg-gray-900 border border-gray-700 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
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
      <div className="absolute inset-0 bg-black/30 z-1" />
      
      {/* Date - Top Left */}
      <div className="absolute top-4 left-4 text-white z-20">
        <div className="text-2xl font-bold leading-none">{day}</div>
        <div className="text-sm font-medium opacity-90">{month}</div>
      </div>

      {/* Action Buttons - Top Right */}
      <div className={`absolute top-4 right-4 z-20 transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        {isIndustryUser && (
          <button className="px-3 py-1.5 text-white hover:text-yellow-400 text-sm font-medium transition-all duration-300 cursor-pointer">
            {event.status === 'full' ? 'Full' : 'Apply'}
          </button>
        )}
        
        {!isIndustryUser && (
          <button className="px-3 py-1.5 text-white hover:text-yellow-400 text-sm font-medium transition-all duration-300">
            Get Tickets
          </button>
        )}
      </div>

      {/* Bottom Section - Event Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
        <div className="space-y-1">
          <h3 className="font-bold text-lg leading-tight">
            {event.title}
          </h3>
          <p className="text-sm opacity-90">
            {event.venue}
          </p>
        </div>
      </div>
    </div>
  );
};
