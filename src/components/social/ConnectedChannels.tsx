/**
 * ConnectedChannels Component
 * Displays user's connected social media accounts
 */

import { Plus, Link as LinkIcon, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocialChannels } from '@/hooks/useSocialMedia';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500',
  twitter: 'bg-blue-400',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-black',
  youtube: 'bg-red-600',
  threads: 'bg-black',
  bluesky: 'bg-blue-500',
  pinterest: 'bg-red-500',
  reddit: 'bg-orange-600',
};

export function ConnectedChannels() {
  const { channels, isLoading, disconnectChannel, isDisconnecting } = useSocialChannels();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading channels...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Platforms</CardTitle>
              <CardDescription>
                Manage your connected social media accounts
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Connect Platform
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <Alert>
              <LinkIcon className="h-4 w-4" />
              <AlertDescription>
                No platforms connected yet. Click "Connect Platform" to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channels.map(channel => (
                <Card key={channel.id} className="overflow-hidden">
                  <div className={`h-2 ${PLATFORM_COLORS[channel.platform] || 'bg-gray-500'}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="professional-button capitalize mb-2">
                          {channel.platform}
                        </Badge>
                        <CardTitle className="text-base">{channel.name}</CardTitle>
                        {channel.username && (
                          <CardDescription className="mt-1">
                            {channel.username}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {channel.isActive ? (
                          <Badge variant="default" className="bg-green-500">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectChannel(channel.id)}
                        disabled={isDisconnecting}
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                    {channel.lastSync && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last synced: {new Date(channel.lastSync).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Platforms Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PLATFORM_COLORS).map(platform => (
              <Badge key={platform} className="professional-button capitalize">
                {platform}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
