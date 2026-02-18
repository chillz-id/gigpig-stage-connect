/**
 * SeriesOverview Page
 *
 * Main series management interface with tab navigation:
 * - Overview: Series analytics with financial summary, date range filter
 * - Events: List of events in the series with metrics
 * - Partners: Manage series-level partners (inherited to all events)
 * - Deals: Create and manage series-level deals
 *
 * Route: /series/:seriesId
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Users, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useSeriesInfo } from '@/hooks/useSeriesAnalytics';
import SeriesOverviewTab from './series-overview/SeriesOverviewTab';
import SeriesEventsTab from './series-overview/SeriesEventsTab';
import SeriesPartnersTab from './series-overview/SeriesPartnersTab';
import SeriesDealsTab from './series-overview/SeriesDealsTab';

type TabValue = 'overview' | 'events' | 'partners' | 'deals';

export default function SeriesOverview() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to 'overview'
  const currentTab = (searchParams.get('tab') as TabValue) || 'overview';

  // Fetch series info
  const {
    data: series,
    isLoading: seriesLoading,
    error: seriesError,
  } = useSeriesInfo(seriesId);

  // Handle tab change - update URL
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Auth guards
  if (!seriesId) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Series ID is required.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>You must be logged in to view series.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (seriesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (seriesError || !series) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {seriesError instanceof Error
              ? seriesError.message
              : 'Failed to load series. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate('/recurring')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Series
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/recurring')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Series
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Repeat className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">{series.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {series.event_count} event{series.event_count !== 1 ? 's' : ''} in series
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Series Overview
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="mt-6">
            <TabsContent value="overview" className="space-y-6">
              <SeriesOverviewTab seriesId={seriesId} />
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <SeriesEventsTab seriesId={seriesId} />
            </TabsContent>

            <TabsContent value="partners" className="space-y-6">
              <SeriesPartnersTab seriesId={seriesId} userId={user.id} />
            </TabsContent>

            <TabsContent value="deals" className="space-y-6">
              <SeriesDealsTab seriesId={seriesId} userId={user.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
