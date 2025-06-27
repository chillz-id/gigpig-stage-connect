
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';
import { PigIcon } from '@/components/ui/pig-icon';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeControls: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const togglePigMode = () => {
    setTheme(theme === 'pig' ? 'light' : 'pig');
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
      
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePigMode}
        className={`w-10 h-10 p-0 rounded-lg transition-all duration-200 ${theme === 'pig' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
      >
        <PigIcon className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default ThemeControls;
