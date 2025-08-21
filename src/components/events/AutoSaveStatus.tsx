import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Check, 
  AlertCircle, 
  Loader2,
  Cloud,
  CloudOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface AutoSaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: Error | null;
  className?: string;
}

const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({
  status,
  lastSaved,
  error,
  className
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setFadeOut(false);

    // Auto-hide "saved" status after 2 seconds
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setIsVisible(false), 300); // Allow fade animation
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!isVisible) return null;

  const getStatusContent = () => {
    switch (status) {
      case 'saving':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <Check className="w-4 h-4" />
            <span>Saved</span>
            {lastSaved && (
              <span className="text-xs opacity-70 ml-1">
                ({formatDistanceToNow(lastSaved, { addSuffix: true })})
              </span>
            )}
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Failed to save</span>
            {error && (
              <span className="text-xs opacity-70 ml-1">
                ({error.message})
              </span>
            )}
          </>
        );
      default:
        return null;
    }
  };

  const getStatusStyles = () => {
    const baseStyles = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300";
    
    if (theme === 'pleasure') {
      switch (status) {
        case 'saving':
          return cn(baseStyles, "bg-purple-900/20 text-purple-300 border border-purple-700/30");
        case 'saved':
          return cn(baseStyles, "bg-green-900/20 text-green-300 border border-green-700/30");
        case 'error':
          return cn(baseStyles, "bg-red-900/20 text-red-300 border border-red-700/30");
        default:
          return baseStyles;
      }
    } else {
      switch (status) {
        case 'saving':
          return cn(baseStyles, "bg-gray-800/50 text-gray-300 border border-gray-700/50");
        case 'saved':
          return cn(baseStyles, "bg-green-900/30 text-green-400 border border-green-800/50");
        case 'error':
          return cn(baseStyles, "bg-red-900/30 text-red-400 border border-red-800/50");
        default:
          return baseStyles;
      }
    }
  };

  const getAnimationStyles = () => {
    if (fadeOut) {
      return "opacity-0 scale-95";
    }
    if (status === 'saving') {
      return "animate-pulse";
    }
    return "opacity-100 scale-100";
  };

  return (
    <div
      className={cn(
        getStatusStyles(),
        getAnimationStyles(),
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Auto-save status: ${status}`}
    >
      {getStatusContent()}
    </div>
  );
};

// Convenience wrapper with icon-only mode
export const AutoSaveIcon: React.FC<AutoSaveStatusProps & { showText?: boolean }> = ({
  status,
  lastSaved,
  error,
  className,
  showText = false
}) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    // Auto-hide "saved" status after 2 seconds
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <Cloud className="w-5 h-5 animate-pulse" />;
      case 'saved':
        return <Check className="w-5 h-5" />;
      case 'error':
        return <CloudOff className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getIconStyles = () => {
    const baseStyles = "transition-all duration-300";
    
    if (theme === 'pleasure') {
      switch (status) {
        case 'saving':
          return cn(baseStyles, "text-purple-400");
        case 'saved':
          return cn(baseStyles, "text-green-400");
        case 'error':
          return cn(baseStyles, "text-red-400");
        default:
          return baseStyles;
      }
    } else {
      switch (status) {
        case 'saving':
          return cn(baseStyles, "text-gray-400");
        case 'saved':
          return cn(baseStyles, "text-green-500");
        case 'error':
          return cn(baseStyles, "text-red-500");
        default:
          return baseStyles;
      }
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        getIconStyles(),
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Auto-save status: ${status}`}
      title={
        status === 'error' && error 
          ? `Failed to save: ${error.message}` 
          : status === 'saved' && lastSaved
          ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
          : status
      }
    >
      {getIcon()}
      {showText && (
        <span className="text-sm">
          {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Error'}
        </span>
      )}
    </div>
  );
};

export default AutoSaveStatus;