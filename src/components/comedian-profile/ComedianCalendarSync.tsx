import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Link, Unlink, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useCalendarIntegration } from '@/hooks/useCalendarIntegration';
import { useComedianGigs } from '@/hooks/useComedianGigs';
import { useComedianSettings } from '@/hooks/useComedianSettings';
import { useAuth } from '@/contexts/AuthContext';

interface ComedianCalendarSyncProps {
  comedianId: string;
}

const ComedianCalendarSync: React.FC<ComedianCalendarSyncProps> = ({ comedianId }) => {
  const { user } = useAuth();
  const { gigs } = useComedianGigs(comedianId);
  const {
    integrations,
    isLoading,
    isGoogleConnected,
    initiateGoogleCalendarAuth,
    disconnectCalendar,
    isConnecting,
    isDisconnecting
  } = useCalendarIntegration();
  const {
    settings,
    setAutoConfirmSpots,
    isUpdating: isUpdatingSettings,
  } = useComedianSettings(comedianId);

  const isOwnProfile = user?.id === comedianId;

  // Don't show to other users
  if (!isOwnProfile) return null;

  const handleGoogleConnect = () => {
    if (isGoogleConnected) {
      const googleIntegration = integrations.find(i => i.provider === 'google');
      if (googleIntegration) {
        disconnectCalendar(googleIntegration.id);
      }
    } else {
      initiateGoogleCalendarAuth();
    }
  };

  const confirmedGigs = gigs.filter(gig => gig.status === 'confirmed');

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Calendar className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-2xl">
          <Calendar className="w-6 h-6 text-purple-400" />
          Calendar Sync
        </CardTitle>
        <p className="text-gray-300 text-sm">
          Keep your personal calendar updated with your comedy gigs
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sync Status */}
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span className="font-medium text-white">Google Calendar</span>
            </div>
            {isGoogleConnected ? (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="professional-button text-gray-300">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-300 mb-3">
            {isGoogleConnected
              ? 'Your gigs will automatically sync to Google Calendar'
              : 'Connect to automatically add gigs to your Google Calendar'
            }
          </p>

          <Button
            onClick={handleGoogleConnect}
            disabled={isConnecting || isDisconnecting}
            variant={isGoogleConnected ? "secondary" : "default"}
            size="sm"
            className="w-full"
          >
            {isConnecting ? (
              'Connecting...'
            ) : isDisconnecting ? (
              'Disconnecting...'
            ) : isGoogleConnected ? (
              <>
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </>
            ) : (
              <>
                <Link className="w-4 h-4 mr-2" />
                Connect Google
              </>
            )}
          </Button>
        </div>

        {/* Auto-Confirm Setting */}
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <Label htmlFor="auto-confirm" className="text-white font-medium cursor-pointer">
                  Auto-Confirm Spots
                </Label>
                <p className="text-sm text-gray-400">
                  Automatically confirm when added to a lineup
                </p>
              </div>
            </div>
            <Switch
              id="auto-confirm"
              checked={settings.auto_confirm_spots}
              onCheckedChange={setAutoConfirmSpots}
              disabled={isUpdatingSettings}
            />
          </div>
          {settings.auto_confirm_spots && (
            <div className="mt-3 p-2 bg-purple-600/10 rounded border border-purple-500/20">
              <p className="text-xs text-purple-300">
                When a promoter publishes a lineup with you on it, your spot will be automatically confirmed and added to your Google Calendar (if connected).
              </p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-3">Sync Overview</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{confirmedGigs.length}</div>
              <div className="text-sm text-gray-300">Confirmed Gigs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {gigs.filter(g => g.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-300">Pending Gigs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{integrations.length}</div>
              <div className="text-sm text-gray-300">Connected Calendars</div>
            </div>
          </div>
        </div>

        {/* Recent Sync Activity */}
        {integrations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-white font-medium">Connected Calendars</h4>
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between bg-slate-700/30 p-3 rounded">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-white text-sm font-medium">
                      {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)} Calendar
                    </div>
                    <div className="text-gray-400 text-xs">
                      Connected {new Date(integration.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={integration.is_active ? "default" : "secondary"}
                  className={integration.is_active ? "bg-green-600" : ""}
                >
                  {integration.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="text-sm text-gray-400 bg-slate-700/20 p-3 rounded">
          <p className="font-medium mb-2">How Calendar Sync Works:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Google Calendar:</strong> Automatic two-way sync when connected</li>
            <li>• Only confirmed gigs are synced to avoid calendar clutter</li>
            <li>• Updates to gig details will sync automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianCalendarSync;