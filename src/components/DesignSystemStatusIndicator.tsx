import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Visual indicator to show the design system loading status
 * Only shows briefly during initialization, then hides
 */
const DesignSystemStatusIndicator = () => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'hidden'>('loading');

  useEffect(() => {
    const checkDesignSystemStatus = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      // Check if design system CSS variables are applied
      const primaryColor = computedStyle.getPropertyValue('--primary').trim();
      const isDesignSystemLoaded = primaryColor && primaryColor !== '240 5.9% 10%'; // Default value
      
      if (isDesignSystemLoaded) {
        setStatus('loaded');
        // Hide after 2 seconds
        setTimeout(() => setStatus('hidden'), 2000);
      } else {
        // Keep checking for a few seconds
        setTimeout(checkDesignSystemStatus, 500);
      }
    };

    // Start checking after a brief delay
    const timeout = setTimeout(checkDesignSystemStatus, 1000);
    
    // Auto-hide after 10 seconds if still loading
    const autoHideTimeout = setTimeout(() => setStatus('hidden'), 10000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(autoHideTimeout);
    };
  }, []);

  if (status === 'hidden') return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'loaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return 'Loading design system...';
      case 'loaded':
        return 'Design system loaded!';
      case 'error':
        return 'Design system failed to load';
      default:
        return '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border border-border rounded-lg p-3 shadow-lg animate-in fade-in-0 slide-in-from-bottom-2">
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className="text-card-foreground">{getStatusMessage()}</span>
      </div>
    </div>
  );
};

export default DesignSystemStatusIndicator;