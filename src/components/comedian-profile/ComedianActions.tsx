
import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';

interface ComedianActionsProps {
  email: string | null;
  name: string | null;
  onShare: () => void;
  onContact: () => void;
}

const ComedianActions: React.FC<ComedianActionsProps> = ({ email, name, onShare, onContact }) => {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [clickedAction, setClickedAction] = useState<string | null>(null);
  const [showBookText, setShowBookText] = useState(false);

  useEffect(() => {
    // Trigger text slide-in animation for Book Now
    const timer = setTimeout(() => setShowBookText(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = (action: string) => {
    setClickedAction(action);
    setTimeout(() => setClickedAction(null), 150);
    
    if (action === 'book') onContact();
  };

  const isHovered = (action: string) => hoveredAction === action;
  const isClicked = (action: string) => clickedAction === action;

  return (
    <div className="relative">
      {/* Main Actions Container */}
      <div className="flex flex-col gap-6 mt-4">
        {/* Book Now - Make entire container clickable */}
        <div 
          className={`flex items-center group cursor-pointer transition-all duration-200 ${
            isHovered('book') ? 'transform -translate-y-1' : ''
          } ${isClicked('book') ? 'transform translate-y-0.5' : ''}`}
          onMouseEnter={() => setHoveredAction('book')}
          onMouseLeave={() => setHoveredAction(null)}
          onClick={() => handleClick('book')}
        >
          <div className="relative">
            <Mail className="w-6 h-6 text-white" />
          </div>
          
          {/* Animated Text - Now clickable */}
          <div className={`overflow-hidden transition-all duration-500 ${showBookText ? 'w-auto ml-3' : 'w-0'}`}>
            <span className={`text-white text-lg font-medium whitespace-nowrap transition-transform duration-500 hover:text-purple-300 ${
              showBookText ? 'translate-x-0' : 'translate-x-full'
            }`}>
              Book Now
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComedianActions;
