import { useUnifiedGigs } from '@/hooks/useUnifiedGigs';
import { GigCalendar } from '@/components/comedian/GigCalendar';
import { CalendarSubscriptionDialog } from '@/components/calendar/CalendarSubscriptionDialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Download, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { icalService } from '@/services/calendar/ical-service';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

/**
 * Calendar Page - Unified view of all comedian's gigs
 * Shows confirmed platform spots + manual gigs in calendar format
 */
export default function Calendar() {
  const { data: gigs, isLoading, isError } = useUnifiedGigs();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  const handleDownloadICS = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to download calendar',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloading(true);

    try {
      // Get user's calendar subscription token
      const { data: subscription } = await supabase
        .from('calendar_subscriptions')
        .select('token')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!subscription?.token) {
        toast({
          title: 'Error',
          description: 'Calendar subscription not found',
          variant: 'destructive',
        });
        return;
      }

      // Generate iCal feed
      const icalContent = await icalService.generateFeedForToken(
        subscription.token
      );

      if (!icalContent) {
        toast({
          title: 'Error',
          description: 'Failed to generate calendar feed',
          variant: 'destructive',
        });
        return;
      }

      // Trigger download
      icalService.downloadICalFile(icalContent);

      toast({
        title: 'Success',
        description: 'Calendar downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to download calendar',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Helmet>
          <title>Calendar - Stand Up Sydney</title>
        </Helmet>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Calendar</h1>
          <p className="text-muted-foreground">
            Unable to load your gigs. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Helmet>
        <title>My Calendar - Stand Up Sydney</title>
        <meta
          name="description"
          content="View all your upcoming comedy gigs in one unified calendar"
        />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Calendar</h1>
          <p className="text-muted-foreground mt-1">
            All your gigs in one place
          </p>
        </div>

        {/* Download and Subscribe buttons */}
        <div className="flex gap-2">
          <Button
            className="professional-button"
            onClick={handleDownloadICS}
            disabled={isDownloading || !gigs || gigs.length === 0}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download .ics
          </Button>
          <Button
            className="professional-button"
            onClick={() => setSubscriptionDialogOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Subscribe to Calendar
          </Button>
        </div>
      </div>

      {/* Calendar Subscription Dialog */}
      <CalendarSubscriptionDialog
        open={subscriptionDialogOpen}
        onOpenChange={setSubscriptionDialogOpen}
      />

      {/* Color Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500 bg-purple-50 rounded" />
          <span className="text-sm font-medium">Platform Gigs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-500 bg-green-50 rounded" />
          <span className="text-sm font-medium">Manual Gigs</span>
        </div>
      </div>

      {/* Calendar Component */}
      <GigCalendar gigs={gigs || []} />
    </div>
  );
}
