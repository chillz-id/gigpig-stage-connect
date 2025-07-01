
import React, { useState, useEffect } from 'react';
import { Mail, Share2, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ComedianActionsProps {
  email: string | null;
  name: string | null;
  onShare: () => void;
}

const ComedianActions: React.FC<ComedianActionsProps> = ({ email, name, onShare }) => {
  const { hasRole } = useAuth();
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [clickedAction, setClickedAction] = useState<string | null>(null);
  const [showBookText, setShowBookText] = useState(false);

  useEffect(() => {
    // Trigger text slide-in animation for Book Now
    const timer = setTimeout(() => setShowBookText(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleContact = () => {
    if (email) {
      const subject = `Booking Inquiry for ${name}`;
      const body = `Hi ${name},\n\nI'm interested in booking you for an upcoming show. Let's discuss the details.\n\nBest regards,`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleClick = (action: string) => {
    setClickedAction(action);
    setTimeout(() => setClickedAction(null), 150);
    
    if (action === 'book') handleContact();
    if (action === 'share') onShare();
  };

  const isHovered = (action: string) => hoveredAction === action;
  const isClicked = (action: string) => clickedAction === action;

  return (
    <div className="relative">
      {/* Check Availability - Top Left, Small, Transparent */}
      {hasRole('admin') && (
        <div 
          className="absolute -top-12 -left-4 flex items-center opacity-60 cursor-pointer"
          onMouseEnter={() => setHoveredAction('availability')}
          onMouseLeave={() => setHoveredAction(null)}
          onClick={() => handleClick('availability')}
        >
          <Calendar className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium ml-1">Check Availability</span>
        </div>
      )}

      {/* Main Actions Container */}
      <div className="flex flex-col gap-6 mt-4">
        {/* Book Now - Brought Down */}
        <div className="flex items-center group">
          <div
            className={`relative cursor-pointer transition-all duration-200 ${
              isHovered('book') ? 'transform -translate-y-1' : ''
            } ${isClicked('book') ? 'transform translate-y-0.5' : ''}`}
            onMouseEnter={() => setHoveredAction('book')}
            onMouseLeave={() => setHoveredAction(null)}
            onClick={() => handleClick('book')}
          >
            <Mail className="w-6 h-6 text-white" />
          </div>
          
          {/* Animated Text */}
          <div className={`overflow-hidden transition-all duration-500 ${showBookText ? 'w-auto ml-3' : 'w-0'}`}>
            <span className={`text-white text-lg font-medium whitespace-nowrap transition-transform duration-500 ${
              showBookText ? 'translate-x-0' : 'translate-x-full'
            }`}>
              Book Now
            </span>
          </div>
        </div>
      </div>

      {/* Share Profile - Top Right, Same Size as Social Icons */}
      <div 
        className="absolute -top-8 -right-8 flex items-center opacity-60"
        onMouseEnter={() => setHoveredAction('share')}
        onMouseLeave={() => setHoveredAction(null)}
      >
        {/* Animated Text - Slides from Left */}
        <div className={`overflow-hidden transition-all duration-300 ${
          isHovered('share') ? 'w-24 mr-2' : 'w-0'
        }`}>
          <span className={`text-white text-sm whitespace-nowrap transition-transform duration-300 ${
            isHovered('share') ? 'translate-x-0' : 'translate-x-full'
          }`}>
            Share Profile
          </span>
        </div>
        
        <div
          className={`cursor-pointer transition-all duration-200 ${
            isHovered('share') ? 'transform -translate-y-0.5' : ''
          } ${isClicked('share') ? 'transform translate-y-0.5' : ''}`}
          onClick={() => handleClick('share')}
        >
          <Share2 className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export default ComedianActions;
