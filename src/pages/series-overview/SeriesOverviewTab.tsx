/**
 * SeriesOverviewTab Component
 *
 * Displays financial summary, attendance stats, and per-event breakdown
 * for a recurring series. Supports date range filtering.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, DollarSign, Ticket, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useSeriesAnalytics, type DateRange } from '@/hooks/useSeriesAnalytics';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SeriesOverviewTabProps {
  seriesId: string;
}

export default function SeriesOverviewTab({ seriesId }: SeriesOverviewTabProps) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  // Fetch analytics with optional date range
  const { data: analytics, isLoading, error } = useSeriesAnalytics(seriesId, dateRange);

  // Date range helpers
  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setDateRange(prev => ({
        start: date,
        end: prev?.end || new Date(),
      }));
    }
    setStartPickerOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setDateRange(prev => ({
        start: prev?.start || new Date(date.getFullYear(), 0, 1),
        end: date,
      }));
    }
    setEndPickerOpen(false);
  };

  const clearDateRange = () => {
    setDateRange(undefined);
  };

  // Quick date range presets
  const setNext30Days = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setDateRange({ start: now, end });
  };

  const setLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    setDateRange({ start, end });
  };

  const setLastQuarter = () => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
    const end = new Date(now.getFullYear(), currentQuarter * 3, 0);
    setDateRange({ start, end });
  };

  const setThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    setDateRange({ start, end: now });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Failed to load analytics. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.totalRevenue || 0)}
              </div>
            )}
            {isLoading ? (
              <Skeleton className="mt-1 h-4 w-32" />
            ) : (
              <p className="text-xs text-muted-foreground">
                Net: {formatCurrency(analytics?.netRevenue || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {analytics?.totalTicketsSold || 0}
              </div>
            )}
            {isLoading ? (
              <Skeleton className="mt-1 h-4 w-40" />
            ) : (
              <p className="text-xs text-muted-foreground">
                Avg {Math.round(analytics?.averageTicketsPerEvent || 0)} per event
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {analytics?.eventCount || 0}
              </div>
            )}
            {isLoading ? (
              <Skeleton className="mt-1 h-4 w-36" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {analytics?.upcomingEventCount || 0} upcoming, {analytics?.pastEventCount || 0} past
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.averageRevenuePerEvent || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Per event average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter - Compact */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">From:</span>
        <Popover open={startPickerOpen} onOpenChange={setStartPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="w-36">
              <Calendar className="mr-2 h-4 w-4" />
              {dateRange?.start ? formatDate(dateRange.start.toISOString()) : 'Start'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dateRange?.start}
              onSelect={handleStartDateSelect}
              disabled={(date) => dateRange?.end ? date > dateRange.end : false}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-sm text-muted-foreground">To:</span>
        <Popover open={endPickerOpen} onOpenChange={setEndPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="w-36">
              <Calendar className="mr-2 h-4 w-4" />
              {dateRange?.end ? formatDate(dateRange.end.toISOString()) : 'End'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dateRange?.end}
              onSelect={handleEndDateSelect}
              disabled={(date) => dateRange?.start ? date < dateRange.start : false}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={setNext30Days}>
            Next 30 Days
          </Button>
          <Button variant="secondary" size="sm" onClick={setLastMonth}>
            Last Month
          </Button>
          <Button variant="secondary" size="sm" onClick={setLastQuarter}>
            Last Quarter
          </Button>
          <Button variant="secondary" size="sm" onClick={setThisYear}>
            This Year
          </Button>
          {dateRange && (
            <Button variant="ghost" size="sm" onClick={clearDateRange}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Events Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Events Breakdown</CardTitle>
          <CardDescription>
            Performance metrics for each event in the series
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : analytics?.events.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No events found{dateRange ? ' in the selected date range' : ''}.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tickets</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.events.map((event) => (
                  <TableRow
                    key={event.id}
                    className={event.event_uuid ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => event.event_uuid && navigate(`/events/${event.event_uuid}/manage`, { state: { fromSeries: seriesId } })}
                  >
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{formatDate(event.event_date)}</TableCell>
                    <TableCell>{event.venue_name || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={event.is_past ? 'default' : 'secondary'}
                        className={!event.is_past ? 'bg-green-500 text-white' : ''}
                      >
                        {event.is_past ? 'Completed' : 'On Sale'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{event.tickets_sold}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(event.total_revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
