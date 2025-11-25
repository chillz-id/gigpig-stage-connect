import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Wifi, Bell, Share, Zap, CloudOff, Home } from 'lucide-react';
import { pwaService } from '@/services/pwaService';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { cn } from '@/lib/utils';

interface PWAInstallerProps {
  onClose?: () => void;
  className?: string;
  /** Variant for different contexts */
  variant?: 'card' | 'inline' | 'compact';
  /** Show after specific trigger */
  trigger?: 'manual' | 'booking' | 'events' | 'returning';
}

export const PWAInstaller: React.FC<PWAInstallerProps> = ({
  onClose,
  className,
  variant = 'card',
  trigger = 'manual',
}) => {
  const { isMobile, isSmallMobile } = useMobileLayout();
  const [capabilities, setCapabilities] = useState(pwaService.getCapabilities());
  const [isInstalling, setIsInstalling] = useState(false);
  const [offlineActionsCount, setOfflineActionsCount] = useState(0);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    const updateStats = async () => {
      setOfflineActionsCount(pwaService.getOfflineActionsCount());
      setCacheSize(await pwaService.getCacheSize());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await pwaService.installApp();
    setIsInstalling(false);
    
    if (success && onClose) {
      onClose();
    }
  };

  const handleSubscribeNotifications = async () => {
    await pwaService.subscribeToPushNotifications();
    setCapabilities(pwaService.getCapabilities());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (capabilities.isInstalled) {
    return (
      <Card className={cn(className, isMobile && "border-x-0 rounded-none")}>
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isMobile ? "pb-2 px-4" : "pb-3"
        )}>
          <CardTitle className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
            App Status
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={cn(isMobile && "touch-target-44")}
            >
              <X className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>
          )}
        </CardHeader>
        <CardContent className={cn("space-y-4", isMobile && "px-4")}>
          <div className="flex items-center gap-2">
            <Smartphone className={cn("text-green-500", isMobile ? "h-6 w-6" : "h-5 w-5")} />
            <span className={cn(isMobile ? "text-base" : "text-sm")}>App is installed and ready</span>
            <Badge variant="secondary" className={cn(isMobile && "text-xs")}>Installed</Badge>
          </div>

          <div className={cn(
            "gap-4 text-sm",
            isMobile ? "flex flex-col" : "grid grid-cols-2"
          )}>
            <div className={cn("space-y-2", isMobile && "space-y-3")}>
              <div className="flex items-center gap-2">
                <CloudOff className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                <span>Offline Actions: {offlineActionsCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                <span>Cache Size: {formatBytes(cacheSize)}</span>
              </div>
            </div>

            <div className={cn("space-y-2", isMobile && "space-y-3")}>
              {capabilities.supportsPushNotifications && (
                <Button
                  className={cn("w-full", isMobile && "touch-target-44")}
                  size={isMobile ? "default" : "sm"}
                  onClick={handleSubscribeNotifications}
                >
                  <Bell className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
                  {isMobile ? "Notifications" : "Enable Notifications"}
                </Button>
              )}

              {capabilities.supportsShare && (
                <Button
                  variant="secondary"
                  className={cn("w-full", isMobile && "touch-target-44")}
                  size={isMobile ? "default" : "sm"}
                  onClick={() => pwaService.shareContent({
                    title: 'Stand Up Sydney',
                    text: 'Check out this amazing comedy platform!',
                    url: window.location.href
                  })}
                >
                  <Share className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
                  Share App
                </Button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t">
            <h4 className={cn("font-medium mb-2", isMobile ? "text-sm" : "text-xs")}>Available Features</h4>
            <div className={cn(
              "grid gap-2",
              isMobile ? "grid-cols-1" : "grid-cols-2 gap-1 text-xs"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "rounded-full",
                  isMobile ? "w-3 h-3" : "w-2 h-2",
                  capabilities.isOfflineCapable ? 'bg-green-500' : 'bg-gray-300'
                )} />
                <span className={cn(isMobile && "text-sm")}>Offline Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "rounded-full",
                  isMobile ? "w-3 h-3" : "w-2 h-2",
                  capabilities.supportsPushNotifications ? 'bg-green-500' : 'bg-gray-300'
                )} />
                <span className={cn(isMobile && "text-sm")}>Push Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "rounded-full",
                  isMobile ? "w-3 h-3" : "w-2 h-2",
                  capabilities.supportsBackgroundSync ? 'bg-green-500' : 'bg-gray-300'
                )} />
                <span className={cn(isMobile && "text-sm")}>Background Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "rounded-full",
                  isMobile ? "w-3 h-3" : "w-2 h-2",
                  capabilities.supportsShare ? 'bg-green-500' : 'bg-gray-300'
                )} />
                <span className={cn(isMobile && "text-sm")}>Native Sharing</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!capabilities.isInstallable) {
    return null;
  }

  // Compact variant for inline prompts
  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20",
        isMobile && "flex-col text-center",
        className
      )}>
        <div className={cn(
          "flex items-center justify-center rounded-full bg-primary/20",
          isMobile ? "w-12 h-12" : "w-10 h-10"
        )}>
          <Download className={cn("text-primary", isMobile ? "h-6 w-6" : "h-5 w-5")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium", isMobile && "text-sm")}>Install the app</p>
          <p className="text-xs text-muted-foreground">
            {isSmallMobile ? "Fast & offline access" : "Faster loading & offline access"}
          </p>
        </div>
        <Button
          onClick={handleInstall}
          disabled={isInstalling}
          size={isMobile ? "default" : "sm"}
          className={cn(isMobile && "w-full touch-target-44")}
        >
          {isInstalling ? 'Installing...' : 'Install'}
        </Button>
      </div>
    );
  }

  // Inline variant for embedded use
  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg border bg-card",
        isMobile && "flex-col",
        className
      )}>
        <div className={cn("flex items-center gap-3", isMobile && "w-full")}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold">Stand Up Sydney</h4>
            <p className={cn("text-muted-foreground", isMobile ? "text-sm" : "text-xs")}>
              Install for offline access
            </p>
          </div>
        </div>
        <div className={cn("flex gap-2", isMobile && "w-full")}>
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className={cn("flex-1", isMobile && "touch-target-44")}
          >
            <Download className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
            {isInstalling ? 'Installing...' : 'Install'}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className={cn(isMobile && "touch-target-44")}
            >
              Later
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={cn(className, isMobile && "border-x-0 rounded-none")}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0",
        isMobile ? "pb-2 px-4" : "pb-3"
      )}>
        <CardTitle className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
          Install Stand Up Sydney
        </CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={cn(isMobile && "touch-target-44")}
          >
            <X className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
          </Button>
        )}
      </CardHeader>
      <CardContent className={cn("space-y-4", isMobile && "px-4")}>
        <div className={cn("space-y-3", isMobile && "space-y-4")}>
          <p className={cn("text-muted-foreground", isMobile ? "text-base" : "text-sm")}>
            {isMobile
              ? "Get the full experience with our app:"
              : "Get the best experience with our Progressive Web App! Install it for:"}
          </p>

          <ul className={cn("text-sm", isMobile ? "space-y-3" : "space-y-2")}>
            <li className={cn("flex items-center gap-2", isMobile && "gap-3")}>
              <Zap className={cn("text-yellow-500 shrink-0", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              <span>{isMobile ? "Faster loading" : "Faster loading and better performance"}</span>
            </li>
            <li className={cn("flex items-center gap-2", isMobile && "gap-3")}>
              <CloudOff className={cn("text-blue-500 shrink-0", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              <span>{isMobile ? "Works offline" : "Offline access to your events and data"}</span>
            </li>
            <li className={cn("flex items-center gap-2", isMobile && "gap-3")}>
              <Bell className={cn("text-purple-500 shrink-0", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              <span>{isMobile ? "Push notifications" : "Push notifications for important updates"}</span>
            </li>
            <li className={cn("flex items-center gap-2", isMobile && "gap-3")}>
              <Home className={cn("text-green-500 shrink-0", isMobile ? "h-5 w-5" : "h-4 w-4")} />
              <span>{isMobile ? "Home screen access" : "Home screen access like a native app"}</span>
            </li>
          </ul>
        </div>

        <div className={cn(
          isMobile ? "flex flex-col gap-2" : "flex gap-2"
        )}>
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className={cn("flex-1", isMobile && "touch-target-44")}
          >
            <Download className={cn("mr-2", isMobile ? "h-5 w-5" : "h-4 w-4")} />
            {isInstalling ? 'Installing...' : 'Install App'}
          </Button>

          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className={cn(isMobile && "touch-target-44")}
            >
              Later
            </Button>
          )}
        </div>

        {!isMobile && (
          <div className="pt-2 border-t">
            <h4 className="font-medium mb-2 text-sm">Your Browser Supports</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${capabilities.isOfflineCapable ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Offline Mode</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${capabilities.supportsPushNotifications ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Push Notifications</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${capabilities.supportsBackgroundSync ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Background Sync</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${capabilities.supportsShare ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Native Sharing</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};