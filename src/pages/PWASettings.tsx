import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { PWAInstaller } from '@/components/pwa/PWAInstaller';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { usePWA } from '@/hooks/usePWA';
import { 
  Smartphone, 
  Download, 
  Trash2, 
  Bell, 
  Share, 
  HardDrive, 
  Wifi,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react';

const PWASettings: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    capabilities,
    isOnline,
    offlineActionsCount,
    clearOfflineActions,
    subscribeToPushNotifications,
    shareContent,
    cacheSize,
    clearCache,
    storageQuota,
    requestPersistentStorage
  } = usePWA();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storageUsagePercent = storageQuota.quota > 0 
    ? (storageQuota.usage / storageQuota.quota) * 100 
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Progressive Web App Settings</h1>
      </div>

      {/* Connection Status */}
      <OfflineIndicator showDetails className="w-full" />

      {/* Installation Section */}
      {(isInstallable || isInstalled) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>App Installation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PWAInstaller className="border-none shadow-none p-0" />
          </CardContent>
        </Card>
      )}

      {/* Capabilities Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Browser Capabilities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${capabilities.isOfflineCapable ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Offline Mode</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${capabilities.supportsPushNotifications ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Push Notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${capabilities.supportsBackgroundSync ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Background Sync</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${capabilities.supportsShare ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Native Sharing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {capabilities.supportsPushNotifications && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Push Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for events, tasks, and tour updates
                </p>
              </div>
              <Button onClick={subscribeToPushNotifications}>
                <Bell className="h-4 w-4 mr-2" />
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sharing Settings */}
      {capabilities.supportsShare && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share className="h-5 w-5" />
              <span>Sharing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Native Sharing</p>
                <p className="text-sm text-muted-foreground">
                  Share events and content using your device's native sharing
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => shareContent({
                  title: 'Stand Up Sydney',
                  text: 'Check out this amazing comedy platform!',
                  url: window.location.origin
                })}
              >
                <Share className="h-4 w-4 mr-2" />
                Test Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            <span>Offline Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Pending Offline Actions</p>
              <p className="text-sm text-muted-foreground">
                {offlineActionsCount > 0 
                  ? `${offlineActionsCount} actions waiting to sync when online`
                  : 'All actions are synced'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={offlineActionsCount > 0 ? "secondary" : "outline"}>
                {offlineActionsCount} pending
              </Badge>
              {offlineActionsCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearOfflineActions}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>Storage Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cache Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cache Size</p>
                <p className="text-sm text-muted-foreground">
                  Cached data for offline access
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono">{formatBytes(cacheSize)}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearCache}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Storage Quota */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Storage Usage</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(storageQuota.usage)} of {formatBytes(storageQuota.quota)} used
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={requestPersistentStorage}
              >
                Request Persistent Storage
              </Button>
            </div>
            {storageQuota.quota > 0 && (
              <div className="space-y-1">
                <Progress value={storageUsagePercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {storageUsagePercent.toFixed(1)}% of available storage used
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Connection Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Connection Status</p>
              <div className="flex items-center space-x-2 mt-1">
                {isOnline ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <Wifi className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
            </div>
            
            <div>
              <p className="font-medium">Background Sync</p>
              <p className="text-sm text-muted-foreground mt-1">
                {capabilities.supportsBackgroundSync 
                  ? 'Enabled - changes sync automatically'
                  : 'Not supported by your browser'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Version</p>
              <p className="text-muted-foreground">1.0.0</p>
            </div>
            <div>
              <p className="font-medium">Last Updated</p>
              <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium">Display Mode</p>
              <p className="text-muted-foreground">
                {isInstalled ? 'Standalone App' : 'Browser Tab'}
              </p>
            </div>
            <div>
              <p className="font-medium">Platform</p>
              <p className="text-muted-foreground">
                {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWASettings;