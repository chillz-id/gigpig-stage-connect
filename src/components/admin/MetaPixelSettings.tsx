
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Facebook, Settings, Activity, Code, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MetaPixelSettings = () => {
  const [pixelId, setPixelId] = useState('123456789012345');
  const [isEnabled, setIsEnabled] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('TEST12345');
  const [customEvents, setCustomEvents] = useState([
    { name: 'ViewEvent', description: 'User views event details', enabled: true },
    { name: 'BookEvent', description: 'User books an event', enabled: true },
    { name: 'RegisterComedian', description: 'New comedian registration', enabled: true },
    { name: 'CreateEvent', description: 'Promoter creates new event', enabled: false }
  ]);

  const { toast } = useToast();

  const handleSavePixelSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Meta Pixel settings have been updated successfully.",
    });
  };

  const handleTestPixel = () => {
    toast({
      title: "Test Event Sent",
      description: "Test event has been sent to Meta Pixel for verification.",
    });
  };

  const toggleCustomEvent = (index: number) => {
    const updated = [...customEvents];
    updated[index].enabled = !updated[index].enabled;
    setCustomEvents(updated);
  };

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
          <TabsList className="grid w-full grid-cols-4 bg-white/10">
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Settings
            </TabsTrigger>
            <TabsTrigger value="events" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Events
            </TabsTrigger>
            <TabsTrigger value="testing" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Testing
            </TabsTrigger>
            <TabsTrigger value="code" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pixel-enabled" className="text-white">Enable Meta Pixel</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="pixel-enabled"
                      checked={isEnabled}
                      onCheckedChange={setIsEnabled}
                    />
                    <Badge variant={isEnabled ? "default" : "secondary"}>
                      {isEnabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pixel-id" className="text-white">Pixel ID</Label>
                  <Input
                    id="pixel-id"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    placeholder="Enter your Meta Pixel ID"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-token" className="text-white">Access Token (Optional)</Label>
                  <Input
                    id="access-token"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Enter access token for advanced features"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Pixel Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300 text-sm">Pixel installed correctly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300 text-sm">Events firing successfully</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300 text-sm">Some events may be delayed</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSavePixelSettings} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-white font-medium">Custom Events Configuration</h4>
              {customEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <h5 className="text-white font-medium">{event.name}</h5>
                    <p className="text-gray-300 text-sm">{event.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.enabled ? "default" : "secondary"}>
                      {event.enabled ? "Enabled" : "Disabled"}
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
                <Label htmlFor="test-code" className="text-white">Test Event Code</Label>
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
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
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
