
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const MobileThemeControls: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center justify-between py-4 px-2 border-t border-border">
      <div className="flex items-center space-x-3">
        <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={toggleDarkMode}
          className="data-[state=checked]:bg-primary"
        />
        <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="text-base font-medium">Dark Mode</span>
      </div>
    </div>
  );
};

export default MobileThemeControls;
