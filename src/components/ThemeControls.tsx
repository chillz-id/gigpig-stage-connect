
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeControls: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-1">
        <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-200`} />
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={toggleDarkMode}
          className="data-[state=checked]:bg-primary"
        />
        <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-200`} />
      </div>
    </div>
  );
};

export default ThemeControls;
