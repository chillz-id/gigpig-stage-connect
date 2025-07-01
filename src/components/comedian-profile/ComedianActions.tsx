
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
  const [showTexts, setShowTexts] = useState(false);

  useEffect(() => {
    // Trigger text slide-in animation on component mount
    const timer = setTimeout(() => setShowTexts(true), 300);
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

  const ActionButton = ({ action, icon: Icon, text, onClick, show = true }: {
    action: string;
    icon: any;
    text: string;
    onClick: () => void;
    show?: boolean;
  }) => {
    if (!show) return null;

    const isHovered = hoveredAction === action;
    const isClicked = clickedAction === action;

    return (
      <div className="flex items-center group">
        <div
          className={`relative cursor-pointer transition-all duration-200 ${
            isHovered ? 'transform -translate-y-1' : ''
          } ${isClicked ? 'transform translate-y-0.5' : ''}`}
          onMouseEnter={() => setHoveredAction(action)}
          onMouseLeave={() => setHoveredAction(null)}
          onClick={() => handleClick(action)}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* Animated Text */}
        <div className={`overflow-hidden transition-all duration-500 ${showTexts ? 'w-auto ml-3' : 'w-0'}`}>
          <span className={`text-white text-lg font-medium whitespace-nowrap transition-transform duration-500 ${
            showTexts ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {text}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <ActionButton
        action="book"
        icon={Mail}
        text="Book Now"
        onClick={() => {}}
      />
      
      <ActionButton
        action="share"
        icon={Share2}
        text="Share Profile"
        onClick={() => {}}
      />
      
      <ActionButton
        action="availability"
        icon={Calendar}
        text="Check Availability"
        onClick={() => {}}
        show={hasRole('admin')}
      />
    </div>
  );
};

export default ComedianActions;
