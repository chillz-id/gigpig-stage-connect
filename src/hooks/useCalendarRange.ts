import { useState, useMemo, useCallback } from 'react';
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  formatISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';

export type CalendarViewType = 'monthly' | 'weekly';

export interface CalendarRange {
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
}

export const useCalendarRange = (
  initialView: CalendarViewType = 'monthly',
  initialDate: Date = new Date()
) => {
  const [viewType, setViewType] = useState<CalendarViewType>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  const range = useMemo<CalendarRange>(() => {
    const baseDate = selectedDate;

    if (viewType === 'weekly') {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      return {
        start,
        end,
        startISO: formatISO(start, { representation: 'date' }),
        endISO: formatISO(end, { representation: 'date' }),
      };
    }

    const start = startOfMonth(baseDate);
    const end = endOfMonth(baseDate);
    return {
      start,
      end,
      startISO: formatISO(start, { representation: 'date' }),
      endISO: formatISO(end, { representation: 'date' }),
    };
  }, [selectedDate, viewType]);

  const goToNext = useCallback(() => {
    setSelectedDate((date) =>
      viewType === 'weekly' ? addWeeks(date, 1) : addMonths(date, 1)
    );
  }, [viewType]);

  const goToPrevious = useCallback(() => {
    setSelectedDate((date) =>
      viewType === 'weekly' ? subWeeks(date, 1) : subMonths(date, 1)
    );
  }, [viewType]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  return {
    viewType,
    setViewType,
    selectedDate,
    setSelectedDate,
    range,
    goToNext,
    goToPrevious,
    goToToday,
  };
};

export type UseCalendarRangeReturn = ReturnType<typeof useCalendarRange>;
