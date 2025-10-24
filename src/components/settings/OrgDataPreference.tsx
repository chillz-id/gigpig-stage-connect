import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrgDataPreferenceProps {
  userId: string;
  currentValue: boolean;
  onUpdate?: (newValue: boolean) => void;
}

/**
 * Toggle component for user preference to show organization data in personal dashboard
 *
 * When enabled:
 * - Personal dashboard shows both user events and organization events
 * - Clear visual distinction between personal and organization data
 * - Separate sections for "My Events" vs "Organization Events"
 *
 * Updates profiles.show_org_in_personal_view column
 */
export function OrgDataPreference({ userId, currentValue, onUpdate }: OrgDataPreferenceProps) {
  const [isEnabled, setIsEnabled] = useState(currentValue);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ show_org_in_personal_view: checked })
        .eq('id', userId);

      if (error) throw error;

      setIsEnabled(checked);

      toast({
        title: checked ? 'Organization data enabled' : 'Organization data disabled',
        description: checked
          ? 'Your personal dashboard will now show organization data alongside your personal data.'
          : 'Your personal dashboard will only show your personal data.',
      });

      // Notify parent component if callback provided
      onUpdate?.(checked);
    } catch (error) {
      console.error('Error updating org data preference:', error);
      toast({
        title: 'Failed to update preference',
        description: 'There was an error updating your organization data preference. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-purple-100 p-3">
            <Building2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Organization Data in Personal View</CardTitle>
            <CardDescription className="mt-1">
              Choose whether to see organization data alongside your personal data when viewing your
              personal dashboard and profile.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3 flex-1">
              {isEnabled ? (
                <Eye className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <Label htmlFor="org-data-toggle" className="cursor-pointer text-base font-medium">
                  {isEnabled ? 'Showing organization data' : 'Hiding organization data'}
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  {isEnabled
                    ? 'Your personal dashboard displays both personal and organization events, tasks, and media.'
                    : 'Your personal dashboard only shows your personal data. Switch to organization profile to see org data.'}
                </p>
              </div>
            </div>
            <Switch
              id="org-data-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
              className="flex-shrink-0"
            />
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How this works</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  <strong>Enabled:</strong> Your personal dashboard will show cards for both "My Events"
                  and "Organization Events" with clear visual distinction
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  <strong>Disabled:</strong> Your personal dashboard only shows your own data. Use the
                  profile switcher to access organization data
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  You can change this preference at any time from your profile settings
                </span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
