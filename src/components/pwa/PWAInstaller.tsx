import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Wifi, Bell, Share } from 'lucide-react';
import { pwaService } from '@/services/pwaService';

interface PWAInstallerProps {
  onClose?: () => void;
  className?: string;
}

export const PWAInstaller: React.FC<PWAInstallerProps> = ({ onClose, className }) => {
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
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-semibold">App Status</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-green-500" />
            <span className="text-sm">App is installed and ready to use</span>
            <Badge variant="secondary">Installed</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4" />
                <span>Offline Actions: {offlineActionsCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Cache Size: {formatBytes(cacheSize)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {capabilities.supportsPushNotifications && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubscribeNotifications}
                  className="w-full"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </Button>
              )}
              
              {capabilities.supportsShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pwaService.shareContent({
                    title: 'Stand Up Sydney',
                    text: 'Check out this amazing comedy platform!',
                    url: window.location.href
                  })}
                  className="w-full"
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share App
                </Button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t">
            <h4 className="font-medium mb-2">Available Features</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${capabilities.isOfflineCapable ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Offline Mode</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${capabilities.supportsPushNotifications ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Push Notifications</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${capabilities.supportsBackgroundSync ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Background Sync</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${capabilities.supportsShare ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Native Sharing</span>
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

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">Install Stand Up Sydney</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get the best experience with our Progressive Web App! Install it for:
          </p>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Faster loading and better performance</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Offline access to your events and data</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Push notifications for important updates</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Home screen access like a native app</span>
            </li>
          </ul>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleInstall} 
            disabled={isInstalling}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isInstalling ? 'Installing...' : 'Install App'}
          </Button>
          
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Later
            </Button>
          )}
        </div>

        <div className="pt-2 border-t">
          <h4 className="font-medium mb-2 text-sm">Your Browser Supports</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${capabilities.isOfflineCapable ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Offline Mode</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${capabilities.supportsPushNotifications ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Push Notifications</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${capabilities.supportsBackgroundSync ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Background Sync</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${capabilities.supportsShare ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Native Sharing</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};