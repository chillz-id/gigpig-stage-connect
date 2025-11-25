import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday, parseISO } from 'date-fns';
import { GigPill, GigPillEvent } from './GigPill';
import { cn } from '@/lib/utils';

interface BlockedTime {
  id: string;
  dateStart: Date;
  dateEnd: Date;
  timeStart?: string;
  timeEnd?: string;
  reason: string;
}

interface WeeklyViewWithTimeSlotsProps {
  events: GigPillEvent[];
  blockedTimes?: BlockedTime[];
  onEventClick?: (event: GigPillEvent) => void;
  onEventDelete?: (eventId: string, type: GigPillEvent['type']) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  startHour?: number;
  endHour?: number;
  showDelete?: boolean;
}

/**
 * WeeklyViewWithTimeSlots Component
 *
 * Displays a weekly calendar view with hourly time slots:
 * - Days of the week as columns
 * - Hours as rows (8am-11pm by default)
 * - Events positioned in their time slots
 * - Blocked time periods shown with overlay
 * - Navigation between weeks
 * - Click on empty slots to add events
 */
export const WeeklyViewWithTimeSlots: React.FC<WeeklyViewWithTimeSlotsProps> = ({
  events,
  blockedTimes = [],
  onEventClick,
  onEventDelete,
  onTimeSlotClick,
  startHour = 8,
  endHour = 23,
  showDelete = false,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeekStart]);

  const hours = useMemo(() => {
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  }, [startHour, endHour]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Get events for a specific day and hour
  const getEventsForSlot = (day: Date, hour: number): GigPillEvent[] => {
    return events.filter(event => {
      const eventDate = typeof event.date === 'string' ? parseISO(event.date) : event.date;
      if (!isSameDay(eventDate, day)) return false;

      const eventHour = eventDate.getHours();
      return eventHour === hour;
    });
  };

  // Check if a time slot is blocked
  const isTimeSlotBlocked = (day: Date, hour: number): BlockedTime | undefined => {
    return blockedTimes.find(blocked => {
      // Check if day is within blocked date range
      const dayTime = day.getTime();
      const startTime = blocked.dateStart.getTime();
      const endTime = blocked.dateEnd.getTime();

      if (dayTime < startTime || dayTime > endTime) return false;

      // If no time specified, entire day is blocked
      if (!blocked.timeStart || !blocked.timeEnd) return true;

      // Check if hour falls within blocked time range
      const [startHourBlock, startMinBlock] = blocked.timeStart.split(':').map(Number);
      const [endHourBlock, endMinBlock] = blocked.timeEnd.split(':').map(Number);

      return hour >= startHourBlock && hour < endHourBlock;
    });
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12am';
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return '12pm';
    return `${hour - 12}pm`;
  };

  const handleSlotClick = (day: Date, hour: number) => {
    if (onTimeSlotClick && !isTimeSlotBlocked(day, hour)) {
      onTimeSlotClick(day, hour);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Button
            className="professional-button"
            size="sm"
            onClick={handlePreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            className="professional-button"
            size="sm"
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="ml-2"
          >
            Today
          </Button>
        </div>
        <h3 className="text-lg font-semibold">
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </h3>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
            <div className="border-r p-2 text-xs font-medium text-muted-foreground">
              Time
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-r p-2 text-center",
                  isToday(day) && "bg-primary/5"
                )}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={cn(
                    "text-lg font-semibold",
                    isToday(day) && "text-primary"
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
              {/* Hour Label */}
              <div className="border-r p-2 text-xs font-medium text-muted-foreground">
                {formatHour(hour)}
              </div>

              {/* Day Slots */}
              {weekDays.map((day) => {
                const slotEvents = getEventsForSlot(day, hour);
                const blocked = isTimeSlotBlocked(day, hour);

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={cn(
                      "border-r p-1 relative cursor-pointer hover:bg-muted/30 transition-colors",
                      isToday(day) && "bg-primary/5",
                      blocked && "bg-red-500/10 cursor-not-allowed"
                    )}
                    onClick={() => handleSlotClick(day, hour)}
                    title={blocked ? `Blocked: ${blocked.reason}` : undefined}
                  >
                    {/* Blocked Overlay */}
                    {blocked && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-red-600 font-medium opacity-70">
                          Blocked
                        </span>
                      </div>
                    )}

                    {/* Events */}
                    {slotEvents.map((event) => (
                      <div key={event.id} className="mb-1">
                        <GigPill
                          event={event}
                          onClick={onEventClick}
                          onDelete={onEventDelete}
                          showDelete={showDelete}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-600/50"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-600/50"></div>
          <span>Personal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-600/50"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/10 border border-red-300"></div>
          <span>Blocked</span>
        </div>
      </div>
    </div>
  );
};
