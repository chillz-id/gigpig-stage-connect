
import React from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ModernEventCardProps {
  event: any;
  interestedEvents: Set<string>;
  onToggleInterested: (event: any) => void;
  onCardClick: (event: any) => void;
  onActionClick: (event: any) => void;
}

export const ModernEventCard: React.FC<ModernEventCardProps> = ({
  event,
  interestedEvents,
  onToggleInterested,
  onCardClick,
  onActionClick,
}) => {
  const { user, hasRole } = useAuth();
  const isComedian = user && hasRole('comedian');
  const isConsumer = !user || (!hasRole('comedian') && !hasRole('promoter') && !hasRole('admin'));
  const isInterested = interestedEvents.has(event.id);
  const availableSpots = (event.spots || 5) - (event.applied_spots || 0);

  // Check if comedian has already applied (this would need to be passed as prop or fetched)
  const hasApplied = false; // This should be determined based on actual application data

  const eventDate = new Date(event.event_date);
  const dateNumber = eventDate.getDate();
  const dateMonth = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  // Use event banner or fallback to placeholder
  const backgroundImage = event.banner_url || 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=400&fit=crop';

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleInterested(event);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onActionClick(event);
  };

  const getActionText = () => {
    if (isComedian) {
      if (hasApplied) return 'Applied';
      if (availableSpots <= 0) return 'Show Full';
      return 'Apply';
    }
    return 'Tickets';
  };

  const getActionClass = () => {
    if (isComedian) {
      if (hasApplied) return 'bg-gray-600/80 text-white';
      if (availableSpots <= 0) return 'bg-gray-600/80 text-white';
      return 'bg-primary/80 text-white';
    }
    return 'bg-green-600/80 text-white';
  };

  return (
    <div 
      className="event-card group cursor-pointer"
      onClick={() => onCardClick(event)}
      style={{
        aspectRatio: '16/9',
        height: '200px',
        width: '100%',
        maxWidth: '400px',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '12px',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Date - Top Left */}
      <div 
        className="event-date"
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          textAlign: 'center',
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.7)',
          zIndex: 2,
        }}
      >
        <span 
          className="date-number"
          style={{
            display: 'block',
            fontSize: '18px',
            fontWeight: '700',
            lineHeight: '1',
            marginBottom: '2px',
          }}
        >
          {dateNumber}
        </span>
        <span 
          className="date-month"
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '600',
            lineHeight: '1',
            letterSpacing: '0.5px',
          }}
        >
          {dateMonth}
        </span>
      </div>

      {/* Heart - Top Right */}
      {isConsumer && (
        <button
          className="heart-icon transition-opacity duration-200 hover:scale-110"
          onClick={handleHeartClick}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            fontSize: '16px',
            color: isInterested ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            zIndex: 2,
            background: 'none',
            border: 'none',
            padding: '4px',
          }}
        >
          <Heart className={`w-4 h-4 ${isInterested ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* Bottom Overlay */}
      <div 
        className="event-overlay"
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
          padding: '16px',
          borderRadius: '0 0 12px 12px',
        }}
      >
        <div className="flex justify-between items-end w-full">
          {/* Event Info */}
          <div className="flex-1 pr-3">
            <div 
              className="event-title"
              style={{
                fontSize: '16px',
                fontWeight: '600',
                lineHeight: '1.2',
                marginBottom: '4px',
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {event.title}
            </div>
            <div 
              className="event-venue"
              style={{
                fontSize: '12px',
                fontWeight: '400',
                opacity: '0.8',
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {event.venue}
            </div>
          </div>

          {/* Action Button */}
          <button
            className={`card-action-text transition-all duration-200 hover:opacity-90 ${getActionClass()}`}
            onClick={handleActionClick}
            disabled={(isComedian && availableSpots <= 0) || (isComedian && hasApplied)}
            style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '6px 12px',
              borderRadius: '4px',
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
              border: 'none',
              cursor: ((isComedian && availableSpots <= 0) || (isComedian && hasApplied)) ? 'not-allowed' : 'pointer',
            }}
          >
            {getActionText()}
          </button>
        </div>
      </div>
    </div>
  );
};
