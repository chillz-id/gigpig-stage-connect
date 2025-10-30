import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { UnifiedGig } from '@/hooks/useUnifiedGigs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GigCalendarProps {
  gigs: UnifiedGig[];
  onGigClick?: (gig: UnifiedGig) => void;
  initialMonth?: Date;
}

/**
 * Generate calendar grid days for a given month
 * Returns 42 days (6 weeks) to maintain consistent grid size
 */
function generateCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  return eachDayOfInterval({ start, end });
}

/**
 * Group gigs by date (yyyy-MM-dd format)
 */
function groupGigsByDate(gigs: UnifiedGig[]): Record<string, UnifiedGig[]> {
  const grouped: Record<string, UnifiedGig[]> = {};

  for (const gig of gigs) {
    const dateKey = format(new Date(gig.start_datetime), 'yyyy-MM-dd');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(gig);
  }

  return grouped;
}

export function GigCalendar({ gigs, onGigClick, initialMonth }: GigCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth || new Date());

  const calendarDays = generateCalendarDays(currentMonth);
  const gigsByDate = groupGigsByDate(gigs);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="calendar-container space-y-4">
      {/* Header with month/year and nav buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers (Sun-Sat) */}
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1" data-testid="calendar-grid">
        {calendarDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayGigs = gigsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={dateKey}
              className={cn(
                'min-h-[100px] border rounded-lg p-2 space-y-1',
                !isCurrentMonth && 'bg-muted/50 text-muted-foreground'
              )}
            >
              {/* Day number */}
              <div className="text-sm font-medium">{format(day, 'd')}</div>

              {/* Gig badges */}
              <div className="space-y-1">
                {dayGigs.map(gig => (
                  <button
                    key={gig.id}
                    onClick={() => onGigClick?.(gig)}
                    className={cn(
                      'w-full text-left text-xs px-2 py-1 rounded border truncate hover:opacity-80 transition-opacity',
                      gig.source === 'platform'
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-green-500 bg-green-50 text-green-900'
                    )}
                    title={`${gig.title}${gig.venue_name ? ` at ${gig.venue_name}` : ''}`}
                  >
                    {gig.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
