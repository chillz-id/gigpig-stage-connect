
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const ThemeControls: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'business' ? 'pleasure' : 'business')}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300",
        theme === 'business' 
          ? "bg-gradient-to-r from-gray-700 to-red-700 text-white shadow-lg" 
          : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
      )}
    >
      {theme === 'business' ? "BUSINESS" : "PLEASURE"}
    </button>
  );
};

export default ThemeControls;
