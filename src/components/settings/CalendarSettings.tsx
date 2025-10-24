import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCalendarPreferences } from '@/hooks/useCalendarPreferences';
import { useToast } from '@/hooks/use-toast';

export function CalendarSettings() {
  const { shouldHideSundays, toggleSundayVisibility, isLoading } = useCalendarPreferences();
  const { toast } = useToast();

  const handleToggleSundays = async () => {
    try {
      await toggleSundayVisibility();
      toast({
        title: 'Calendar settings updated',
        description: shouldHideSundays()
          ? 'Sundays will now be shown in Shows calendar'
          : 'Sundays will now be hidden in Shows calendar',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update calendar settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Display</CardTitle>
        <CardDescription>
          Customize how calendars are displayed across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1">
              <Label htmlFor="hide-sundays" className="text-sm font-medium">
                Hide Sundays in Shows Calendar
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, the Shows browse calendar will display Monday-Saturday only (6-column grid)
              </p>
            </div>
            <Switch
              id="hide-sundays"
              checked={shouldHideSundays()}
              onCheckedChange={handleToggleSundays}
              disabled={isLoading}
            />
          </div>

          <div className="p-4 rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This setting only affects the Shows browse calendar view. Other
              calendars throughout the platform will continue to display all days of the week.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
