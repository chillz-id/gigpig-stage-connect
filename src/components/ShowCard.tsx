
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { MagicCard } from '@/components/ui/magic-card';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin } from 'lucide-react';

interface ShowCardProps {
  show: any;
  interestedEvents: Set<string>;
  onToggleInterested: (event: any) => void;
  onApply: (event: any) => void;
  onBuyTickets: (event: any) => void;
  onShowDetails: (event: any) => void;
  onGetDirections: (event: any) => void;
  onRecurringApply?: (event: any) => void;
  hasAppliedToEvent?: (eventId: string) => boolean;
  getApplicationStatus?: (eventId: string) => string | null;
  isApplying?: boolean;
}

export const ShowCard: React.FC<ShowCardProps> = ({
  show,
  interestedEvents,
  onToggleInterested,
  onApply,
  onBuyTickets,
  onShowDetails,
  onGetDirections,
  onRecurringApply,
  hasAppliedToEvent,
  getApplicationStatus,
  isApplying = false,
}) => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));
  const isConsumerUser = !isIndustryUser;
  const availableSpots = (show.spots || 5) - (show.applied_spots || 0);
  const isInterested = interestedEvents.has(show.id);
  const isShowFull = availableSpots <= 0;
  const hasApplied = hasAppliedToEvent ? hasAppliedToEvent(show.id) : false;
  const applicationStatus = getApplicationStatus ? getApplicationStatus(show.id) : null;
  const isComedian = user && hasRole('comedian');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { day, month };
  };

  const { day, month } = formatDate(show.event_date);

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
      className="relative aspect-[4/3] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:translate-y-[-4px] bg-gray-900 border border-gray-700"
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
        <div className="absolute inset-0 z-0">
          {show.banner_url ? (
            <img 
              src={show.banner_url} 
              alt={show.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />
          )}
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40 z-1" />

        {/* Date - Top Left Corner */}
        <div className="absolute top-4 left-4 text-white z-20">
          <div className="text-2xl font-bold leading-none">{day}</div>
          <div className="text-sm font-medium opacity-90">{month}</div>
        </div>

        {/* Content - Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
          <div className="space-y-3">
            {/* Show Title */}
            <h3 className="text-lg font-bold leading-tight">
              {show.title}
            </h3>
            
            {/* Location with Icon - Bottom Left */}
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />
              <p className="text-sm opacity-90 truncate">
                {show.venue}
              </p>
            </div>
          </div>

          {/* Apply Button - Bottom Right - Fade in on hover */}
          <div className="absolute bottom-4 right-4">
            {isComedian && (
              <div
                className={`transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button
                  onClick={() => {
                    if (!isShowFull && !hasApplied && !isApplying) {
                      onApply(show);
                    }
                  }}
                  disabled={isShowFull || hasApplied || isApplying}
                  className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-md ${
                    hasApplied
                      ? 'bg-green-500/80 text-white cursor-default'
                      : isShowFull 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : isApplying
                          ? 'bg-blue-500/80 text-white cursor-wait'
                          : 'bg-blue-500/80 text-white hover:scale-105 hover:bg-blue-600/80'
                  }`}
                >
                  {isApplying ? 'Applying...' : hasApplied ? 'Applied ✓' : isShowFull ? 'Full' : 'Apply'}
                </button>
              </div>
            )}
            
            {/* Show status badge for other industry users */}
            {isIndustryUser && !isComedian && hasApplied && (
              <div
                className={`transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="px-3 py-1.5 text-sm font-medium bg-green-500/80 text-white rounded-md">
                  Applied ✓
                </div>
              </div>
            )}
            
            {isConsumerUser && (
              <div
                className={`transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button
                  onClick={() => onBuyTickets(show)}
                  className="px-3 py-1.5 bg-blue-500/80 text-white hover:scale-105 text-sm font-medium transition-all duration-200 rounded-md hover:bg-blue-600/80"
                >
                  Get Tickets
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MagicCard>
  );
};
