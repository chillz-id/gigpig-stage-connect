import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';

interface OrganizationActionsProps {
  email: string | null;
  organization_name: string | null;
  onShare: () => void;
  onContact: () => void;
}

const OrganizationActions: React.FC<OrganizationActionsProps> = ({ email, organization_name, onShare, onContact }) => {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [clickedAction, setClickedAction] = useState<string | null>(null);
  const [showContactText, setShowContactText] = useState(false);

  useEffect(() => {
    // Trigger text slide-in animation for Contact Us
    const timer = setTimeout(() => setShowContactText(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = (action: string) => {
    setClickedAction(action);
    setTimeout(() => setClickedAction(null), 150);

    if (action === 'contact') onContact();
  };

  const isHovered = (action: string) => hoveredAction === action;
  const isClicked = (action: string) => clickedAction === action;

  return (
    <div className="relative">
      {/* Main Actions Container */}
      <div className="flex flex-col gap-6 mt-4">
        {/* Contact Us - Make entire container clickable */}
        <div
          className={`flex items-center group cursor-pointer transition-all duration-200 ${
            isHovered('contact') ? 'transform -translate-y-1' : ''
          } ${isClicked('contact') ? 'transform translate-y-0.5' : ''}`}
          onMouseEnter={() => setHoveredAction('contact')}
          onMouseLeave={() => setHoveredAction(null)}
          onClick={() => handleClick('contact')}
        >
          <div className="relative">
            <Mail className="w-6 h-6 text-white" />
          </div>

          {/* Animated Text - Now clickable */}
          <div className={`overflow-hidden transition-all duration-500 ${showContactText ? 'w-auto ml-3' : 'w-0'}`}>
            <span className={`text-white text-lg font-medium whitespace-nowrap transition-transform duration-500 hover:text-purple-300 ${
              showContactText ? 'translate-x-0' : 'translate-x-full'
            }`}>
              Contact Us
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationActions;
