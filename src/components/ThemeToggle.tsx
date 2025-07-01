
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'pleasure' ? 'business' : 'pleasure');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`
        transition-all duration-200 rounded-lg flex items-center gap-2
        ${theme === 'pleasure' 
          ? 'text-white hover:bg-white/10 hover:backdrop-blur-md border border-white/20' 
          : 'text-gray-100 hover:bg-gray-700 hover:text-red-400 border border-gray-600'
        }
      `}
      aria-label={`Switch to ${theme === 'pleasure' ? 'Business' : 'Pleasure'} theme`}
    >
      <span className="text-lg">
        {theme === 'pleasure' ? '🏢' : '🎭'}
      </span>
      <span className="hidden sm:block">
        {theme === 'pleasure' ? 'Business' : 'Pleasure'}
      </span>
    </Button>
  );
};

export default ThemeToggle;
