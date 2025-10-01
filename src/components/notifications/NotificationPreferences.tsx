import { ReactNode } from 'react';
import { Mail, Monitor, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationPreferences } from '@/components/notifications/types';

interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => void;
  disabled?: boolean;
}

interface PreferenceSectionProps {
  title: string;
  icon: ReactNode;
  description: string;
  children: ReactNode;
  disabled?: boolean;
}

const PreferenceSection = ({ title, icon, description, children, disabled }: PreferenceSectionProps) => (
  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
    <CardHeader>
      <CardTitle className="text-white flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
      <p className="text-gray-400 text-sm">{description}</p>
    </CardHeader>
    <CardContent className={disabled ? 'space-y-4 opacity-60 pointer-events-none' : 'space-y-4'}>
      {children}
    </CardContent>
  </Card>
);

interface PreferenceToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const PreferenceToggleRow = ({ label, description, checked, onChange, disabled }: PreferenceToggleRowProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-gray-200">{label}</Label>
        {description && <p className="text-gray-500 text-xs">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
};

const NotificationPreferencesPanel = ({ preferences, onUpdate, disabled = false }: NotificationPreferencesProps) => {
  const updateEmail = (partial: Partial<NotificationPreferences['email']>) => {
    onUpdate({ ...preferences, email: { ...preferences.email, ...partial } });
  };

  const updatePush = (partial: Partial<NotificationPreferences['push']>) => {
    onUpdate({ ...preferences, push: { ...preferences.push, ...partial } });
  };

  const updateInApp = (partial: Partial<NotificationPreferences['inApp']>) => {
    onUpdate({ ...preferences, inApp: { ...preferences.inApp, ...partial } });
  };

  const emailToggles: Array<{ key: 'eventUpdates' | 'bookingNotifications' | 'paymentAlerts' | 'systemMessages' | 'promotions'; label: string; }> = [
    { key: 'eventUpdates', label: 'Event updates' },
    { key: 'bookingNotifications', label: 'Booking notifications' },
    { key: 'paymentAlerts', label: 'Payment alerts' },
    { key: 'systemMessages', label: 'System messages' },
    { key: 'promotions', label: 'Promotions' },
  ];

  const pushToggles: Array<{ key: 'eventUpdates' | 'bookingNotifications' | 'paymentAlerts' | 'systemMessages'; label: string; }> = [
    { key: 'eventUpdates', label: 'Event updates' },
    { key: 'bookingNotifications', label: 'Booking notifications' },
    { key: 'paymentAlerts', label: 'Payment alerts' },
    { key: 'systemMessages', label: 'System messages' },
  ];

  return (
    <div className="space-y-6">
      <PreferenceSection
        title="Email Notifications"
        icon={<Mail className="w-5 h-5" />}
        description="Configure notifications delivered to your inbox"
        disabled={disabled}
      >
        <PreferenceToggleRow
          label="Enable email notifications"
          description="Receive notifications via email"
          checked={preferences.email.enabled}
          onChange={(checked) => updateEmail({ enabled: checked })}
          disabled={disabled}
        />

        {preferences.email.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emailToggles.map((toggle) => (
                <PreferenceToggleRow
                  key={toggle.key}
                  label={toggle.label}
                  checked={preferences.email[toggle.key]}
                  onChange={(checked) => updateEmail({ [toggle.key]: checked } as Partial<NotificationPreferences['email']>)}
                  disabled={disabled}
                />
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-white">Email frequency</Label>
              <Select
                value={preferences.email.frequency}
                onValueChange={(value: 'immediate' | 'daily' | 'weekly') => updateEmail({ frequency: value })}
                disabled={disabled}
              >
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </PreferenceSection>

      <PreferenceSection
        title="Push Notifications"
        icon={<Smartphone className="w-5 h-5" />}
        description="Browser and mobile push alerts"
        disabled={disabled}
      >
        <PreferenceToggleRow
          label="Enable push notifications"
          description="Receive browser and mobile push notifications"
          checked={preferences.push.enabled}
          onChange={(checked) => updatePush({ enabled: checked })}
          disabled={disabled}
        />

        {preferences.push.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pushToggles.map((toggle) => (
              <PreferenceToggleRow
                key={toggle.key}
                label={toggle.label}
                checked={preferences.push[toggle.key]}
                onChange={(checked) => updatePush({ [toggle.key]: checked } as Partial<NotificationPreferences['push']>)}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </PreferenceSection>

      <PreferenceSection
        title="In-App Notifications"
        icon={<Monitor className="w-5 h-5" />}
        description="Controls for notifications displayed inside the app"
        disabled={disabled}
      >
        <PreferenceToggleRow
          label="Enable in-app notifications"
          description="Show notifications within the application"
          checked={preferences.inApp.enabled}
          onChange={(checked) => updateInApp({ enabled: checked })}
          disabled={disabled}
        />

        {preferences.inApp.enabled && (
          <div className="space-y-4">
            <PreferenceToggleRow
              label="Sound notifications"
              description="Play sound for new notifications"
              checked={preferences.inApp.sound}
              onChange={(checked) => updateInApp({ sound: checked })}
              disabled={disabled}
            />
            <PreferenceToggleRow
              label="Desktop notifications"
              description="Show notifications even when the tab is inactive"
              checked={preferences.inApp.desktop}
              onChange={(checked) => updateInApp({ desktop: checked })}
              disabled={disabled}
            />
            <div className="space-y-2">
              <Label className="text-white">Minimum priority level</Label>
              <Select
                value={preferences.inApp.priority}
                onValueChange={(value: 'all' | 'high' | 'urgent') => updateInApp({ priority: value })}
                disabled={disabled}
              >
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All notifications</SelectItem>
                  <SelectItem value="high">High priority and above</SelectItem>
                  <SelectItem value="urgent">Urgent only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </PreferenceSection>
    </div>
  );
};

export default NotificationPreferencesPanel;
