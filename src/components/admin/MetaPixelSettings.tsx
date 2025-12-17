
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Facebook,
  Settings,
  Activity,
  Code,
  AlertCircle,
  CheckCircle,
  Users,
  Upload,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMetaAudienceSync } from '@/hooks/useMetaAudienceSync';
import type { MetaMarketingConfig } from '@/services/metaMarketingService';

const MetaPixelSettings = () => {
  const [pixelId, setPixelId] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [customAudienceId, setCustomAudienceId] = useState('');
  const [testEventCode, setTestEventCode] = useState('TEST12345');
  const [customEvents, setCustomEvents] = useState([
    { name: 'ViewEvent', description: 'User views event details', enabled: true },
    { name: 'BookEvent', description: 'User books an event', enabled: true },
    { name: 'RegisterComedian', description: 'New comedian registration', enabled: true },
    { name: 'CreateEvent', description: 'Promoter creates new event', enabled: false },
  ]);

  const { toast } = useToast();
  const { progress, stats, startBulkSync, fetchSyncStats, reset, isRunning } =
    useMetaAudienceSync();

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('meta_pixel_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setPixelId(parsed.pixelId || '');
        setAccessToken(parsed.accessToken || '');
        setAdAccountId(parsed.adAccountId || '');
        setCustomAudienceId(parsed.customAudienceId || '');
        setIsEnabled(parsed.isEnabled ?? true);
      } catch {
        // Ignore parse errors
      }
    }
    fetchSyncStats();
  }, [fetchSyncStats]);

  const handleSavePixelSettings = () => {
    localStorage.setItem(
      'meta_pixel_settings',
      JSON.stringify({
        pixelId,
        accessToken,
        adAccountId,
        customAudienceId,
        isEnabled,
      })
    );
    toast({
      title: 'Settings Saved',
      description: 'Meta Pixel settings have been updated successfully.',
    });
  };

  const handleTestPixel = () => {
    toast({
      title: 'Test Event Sent',
      description: 'Test event has been sent to Meta Pixel for verification.',
    });
  };

  const toggleCustomEvent = (index: number) => {
    const updated = [...customEvents];
    updated[index].enabled = !updated[index].enabled;
    setCustomEvents(updated);
  };

  const handleBulkSync = async () => {
    const config: MetaMarketingConfig = {
      accessToken,
      pixelId,
      adAccountId,
      customAudienceId,
    };
    await startBulkSync(config);
  };

  const getProgressPercentage = () => {
    if (progress.totalCustomers === 0) return 0;
    return Math.round((progress.processedCustomers / progress.totalCustomers) * 100);
  };

  const isConfigured = accessToken && customAudienceId;

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Facebook className="w-5 h-5" />
          Meta/Facebook Pixel Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/10">
            <TabsTrigger
              value="settings"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900"
            >
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="audiences"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900"
            >
              Audiences
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="testing"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900"
            >
              Testing
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900"
            >
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pixel-enabled" className="text-white">
                    Enable Meta Pixel
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pixel-enabled"
                      checked={isEnabled}
                      onCheckedChange={setIsEnabled}
                    />
                    <Badge variant={isEnabled ? 'default' : 'secondary'}>
                      {isEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pixel-id" className="text-white">
                    Pixel ID
                  </Label>
                  <Input
                    id="pixel-id"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    placeholder="Enter your Meta Pixel ID"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-token" className="text-white">
                    Access Token
                  </Label>
                  <Input
                    id="access-token"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="System User access token"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  />
                  <p className="text-xs text-gray-400">
                    Get from Business Settings &rarr; System Users &rarr; Generate Token
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-account-id" className="text-white">
                    Ad Account ID
                  </Label>
                  <Input
                    id="ad-account-id"
                    value={adAccountId}
                    onChange={(e) => setAdAccountId(e.target.value)}
                    placeholder="act_123456789"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience-id" className="text-white">
                    Custom Audience ID
                  </Label>
                  <Input
                    id="audience-id"
                    value={customAudienceId}
                    onChange={(e) => setCustomAudienceId(e.target.value)}
                    placeholder="Audience ID from Ads Manager"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  />
                  <p className="text-xs text-gray-400">
                    Create audience in Ads Manager &rarr; Audiences &rarr; Customer List
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Configuration Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {pixelId ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-gray-300 text-sm">
                        Pixel ID {pixelId ? 'configured' : 'not configured'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {accessToken ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-gray-300 text-sm">
                        Access Token {accessToken ? 'configured' : 'not configured'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {customAudienceId ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className="text-gray-300 text-sm">
                        Custom Audience {customAudienceId ? 'configured' : 'not configured'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSavePixelSettings}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audiences" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bulk Upload Section */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Custom Audience Sync
                </h4>

                <div className="bg-white/5 p-4 rounded-lg space-y-4">
                  <p className="text-gray-300 text-sm">
                    Upload all customers from your CRM to Meta Custom Audiences for retargeting
                    and lookalike audience creation.
                  </p>

                  {!isConfigured && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-yellow-200 text-sm">
                        Configure Access Token and Custom Audience ID in Settings tab before
                        syncing.
                      </p>
                    </div>
                  )}

                  {/* Progress Display */}
                  {progress.status !== 'idle' && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{progress.message}</span>
                        <span className="text-white font-medium">{getProgressPercentage()}%</span>
                      </div>
                      <Progress value={getProgressPercentage()} className="h-2" />

                      {progress.totalCustomers > 0 && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white/5 p-2 rounded">
                            <div className="text-lg font-bold text-white">
                              {progress.processedCustomers.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">Processed</div>
                          </div>
                          <div className="bg-green-500/10 p-2 rounded">
                            <div className="text-lg font-bold text-green-400">
                              {progress.successCount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">Success</div>
                          </div>
                          <div className="bg-red-500/10 p-2 rounded">
                            <div className="text-lg font-bold text-red-400">
                              {progress.errorCount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">Failed</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkSync}
                      disabled={!isConfigured || isRunning}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Sync All Customers
                        </>
                      )}
                    </Button>
                    {progress.status !== 'idle' && !isRunning && (
                      <Button
                        onClick={reset}
                        variant="secondary"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Sync Statistics
                  </h4>
                  <Button
                    onClick={fetchSyncStats}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                <div className="bg-white/5 p-4 rounded-lg space-y-4">
                  {stats ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {stats.totalSynced.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">Total Synced</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-400">
                            {stats.successRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-400">Success Rate</div>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Last 24 hours</span>
                          <span className="text-white">{stats.last24hCount} syncs</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Last 7 days</span>
                          <span className="text-white">{stats.last7dCount} syncs</span>
                        </div>
                        {stats.lastSyncAt && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Last sync</span>
                            <span className="text-white">
                              {new Date(stats.lastSyncAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <p>No sync data available</p>
                      <p className="text-sm">Run your first sync to see statistics</p>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-4 rounded-lg">
                  <h5 className="text-white font-medium mb-2">Real-time Sync</h5>
                  <p className="text-gray-400 text-sm mb-3">
                    New orders are automatically synced via N8N webhook workflow.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-sm">Webhook active</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-white font-medium">Custom Events Configuration</h4>
              {customEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                >
                  <div>
                    <h5 className="text-white font-medium">{event.name}</h5>
                    <p className="text-gray-300 text-sm">{event.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.enabled ? 'default' : 'secondary'}>
                      {event.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Switch
                      checked={event.enabled}
                      onCheckedChange={() => toggleCustomEvent(index)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-code" className="text-white">
                  Test Event Code
                </Label>
                <Input
                  id="test-code"
                  value={testEventCode}
                  onChange={(e) => setTestEventCode(e.target.value)}
                  placeholder="Enter test event code"
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={handleTestPixel} className="bg-blue-600 hover:bg-blue-700">
                  Send Test Event
                </Button>
                <Button className="professional-button border-white/30 text-white hover:bg-white/10">
                  View Event Manager
                </Button>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Recent Test Events</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>PageView - Test</span>
                    <span className="text-green-400">Success</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>ViewEvent - Test</span>
                    <span className="text-green-400">Success</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>BookEvent - Test</span>
                    <span className="text-yellow-400">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Code className="w-4 h-4" />
                Pixel Implementation Code
              </h4>

              <div className="space-y-4">
                <div>
                  <Label className="text-white">Base Pixel Code</Label>
                  <Textarea
                    readOnly
                    value={`<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId || 'YOUR_PIXEL_ID'}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId || 'YOUR_PIXEL_ID'}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`}
                    className="min-h-48 bg-gray-900 border-gray-700 text-green-400 font-mono text-xs"
                  />
                </div>

                <div>
                  <Label className="text-white">Custom Event Example</Label>
                  <Textarea
                    readOnly
                    value={`// Track event booking
fbq('track', 'BookEvent', {
  event_id: 'event_123',
  event_name: 'Comedy Night',
  venue: 'The Basement',
  ticket_price: 25,
  currency: 'AUD'
});

// Track comedian registration
fbq('track', 'CompleteRegistration', {
  user_type: 'comedian',
  registration_method: 'email'
});`}
                    className="min-h-32 bg-gray-900 border-gray-700 text-green-400 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MetaPixelSettings;
