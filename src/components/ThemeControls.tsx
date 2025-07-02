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
    if (autoTheme) return <Clock className="w-3 h-3" />;
    return theme === 'business' ? <User className="w-3 h-3" /> : <Zap className="w-3 h-3" />;
  };

  const getThemeColor = () => {
    if (autoTheme) return "bg-gradient-to-r from-blue-600 to-cyan-600";
    return theme === 'business' 
      ? "bg-gradient-to-r from-gray-700 to-red-700" 
      : "bg-gradient-to-r from-purple-600 to-pink-600";
  };

  const getThemeText = () => {
    if (autoTheme) return "AUTO";
    return theme === 'business' ? "BUSINESS" : "PLEASURE";
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
          onClick={() => setTheme('pleasure')}
          className="text-white hover:bg-purple-700/50 cursor-pointer"
        >
          <Zap className="w-4 h-4 mr-2 text-purple-400" />
          Pleasure Mode
          {theme === 'pleasure' && !autoTheme && (
            <Badge variant="outline" className="ml-auto text-xs">Active</Badge>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/20" />
        
        <DropdownMenuItem 
          onClick={() => setAutoTheme(!autoTheme)}
          className="text-white hover:bg-blue-700/50 cursor-pointer"
        >
          <Clock className="w-4 h-4 mr-2 text-blue-400" />
          Auto Theme
          {autoTheme && (
            <Badge variant="outline" className="ml-auto text-xs">Active</Badge>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/20" />
        
        <DropdownMenuItem 
          onClick={quickToggle}
          className="text-white hover:bg-green-700/50 cursor-pointer"
        >
          <Palette className="w-4 h-4 mr-2 text-green-400" />
          Quick Toggle
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