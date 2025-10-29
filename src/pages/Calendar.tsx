import { useUnifiedGigs } from '@/hooks/useUnifiedGigs';
import { GigCalendar } from '@/components/comedian/GigCalendar';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

/**
 * Calendar Page - Unified view of all comedian's gigs
 * Shows confirmed platform spots + manual gigs in calendar format
 */
export default function Calendar() {
  const { data: gigs, isLoading, isError } = useUnifiedGigs();

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

        {/* Subscribe button - placeholder for Task 19 */}
        <Button variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Subscribe to Calendar
        </Button>
      </div>

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
