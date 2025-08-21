
import React from 'react';

interface PigIconProps {
  className?: string;
}

export const PigIcon: React.FC<PigIconProps> = ({ className = "w-4 h-4" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Pig snout outline */}
      <ellipse cx="12" cy="14" rx="8" ry="6" />
      <circle cx="10" cy="12" r="1" />
      <circle cx="14" cy="12" r="1" />
      <ellipse cx="12" cy="16" rx="2" ry="1" />
    </svg>
  );
};
