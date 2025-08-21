import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Palette, Clock, User, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const ThemeControls: React.FC = () => {
  const { theme, setTheme, autoTheme, setAutoTheme, schedule } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const quickToggle = () => {
    setTheme(theme === 'business' ? 'pleasure' : 'business');
  };

  const getThemeIcon = () => {
    // Always show business icon for now
    return <User className="w-3 h-3" />;
  };

  const getThemeColor = () => {
    // Always show business colors for now
    return "bg-gradient-to-r from-gray-700 to-red-700";
  };

  const getThemeText = () => {
    // Always show BUSINESS for now
    return "BUSINESS";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 text-white shadow-lg hover:scale-105 flex items-center gap-2",
            getThemeColor()
          )}
        >
          {getThemeIcon()}
          {getThemeText()}
          {schedule?.enabled && (
            <Badge variant="outline" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs border-white/50 text-white">
              <Clock className="w-2 h-2" />
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-black/90 border-white/20">
        <DropdownMenuItem 
          onClick={() => setTheme('business')}
          className="text-white hover:bg-gray-700/50 cursor-pointer"
        >
          <User className="w-4 h-4 mr-2 text-red-400" />
          Business Mode
          {theme === 'business' && !autoTheme && (
            <Badge variant="outline" className="ml-auto text-xs">Active</Badge>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => {}} // Disabled for now
          className="text-gray-500 cursor-not-allowed"
        >
          <Zap className="w-4 h-4 mr-2 text-gray-500" />
          Pleasure Mode (Coming Soon)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/20" />
        
        <DropdownMenuItem 
          onClick={() => {}} // Disabled for now
          className="text-gray-500 cursor-not-allowed"
        >
          <Clock className="w-4 h-4 mr-2 text-gray-500" />
          Auto Theme (Coming Soon)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/20" />
        
        <DropdownMenuItem 
          onClick={() => {}} // Disabled for now
          className="text-gray-500 cursor-not-allowed"
        >
          <Palette className="w-4 h-4 mr-2 text-gray-500" />
          Quick Toggle (Coming Soon)
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-white hover:bg-gray-700/50 cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2 text-gray-400" />
          Advanced Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeControls;