
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MonthFilterProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  city?: string; // City to filter events ('sydney' or 'melbourne')
}

// Map city to timezone
const getTimezoneFromCity = (city: string): string => {
  switch (city?.toLowerCase()) {
    case 'sydney':
      return 'Australia/Sydney';
    case 'melbourne':
      return 'Australia/Melbourne';
    default:
      return 'Australia/Sydney';
  }
};

export const MonthFilter: React.FC<MonthFilterProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  city = 'sydney'
}) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Date picker state
  const [open, setOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);

  // Sync temp values with prop changes (e.g., when clicking month tabs)
  useEffect(() => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
  }, [selectedMonth, selectedYear]);

  const timezone = getTimezoneFromCity(city);

  // Fetch which months have events for the selected city (next 12 months)
  const { data: monthsWithEventsMap } = useQuery({
    queryKey: ['months-with-events', city, timezone],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateTime = `${today.toISOString().split('T')[0]} 00:00:00`;

      // Calculate 12 months from today
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 12);
      const endDateTime = `${endDate.toISOString().split('T')[0]} 23:59:59`;

      const { data, error } = await supabase
        .from('session_complete')
        .select('session_start_local')
        .ilike('timezone', timezone)
        .gte('session_start_local', startDateTime)
        .lte('session_start_local', endDateTime);

      if (error) {
        console.error('Error fetching months with events:', error);
        return new Map<string, boolean>();
      }

      // Build a map of "YYYY-MM" to boolean (has events)
      const monthsMap = new Map<string, boolean>();
      data?.forEach(session => {
        // Parse session_start_local (format: "YYYY-MM-DD HH:MM:SS")
        const date = new Date(session.session_start_local.replace(' ', 'T'));
        const yearMonth = `${date.getFullYear()}-${date.getMonth()}`;
        monthsMap.set(yearMonth, true);
      });

      return monthsMap;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Helper function to check if a month NAME has events anywhere in the next 12 months
  const hasEventsInMonthName = (monthIndex: number) => {
    if (!monthsWithEventsMap || monthsWithEventsMap.size === 0) return false;

    // Check if this month name appears in any year within the next 12 months
    for (const [yearMonth] of monthsWithEventsMap) {
      const [, month] = yearMonth.split('-');
      if (parseInt(month) === monthIndex) {
        return true;
      }
    }
    return false;
  };

  // Find the next occurrence of a month within the next 12 months
  const getNextOccurrenceOfMonth = (monthIndex: number): { month: number; year: number } | null => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Check current year first
    if (monthIndex >= currentMonth) {
      return { month: monthIndex, year: currentYear };
    }

    // Otherwise, it's next year
    return { month: monthIndex, year: currentYear + 1 };
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-xl font-semibold hover:text-red-400"
            >
              <Calendar className="w-5 h-5" />
              {months[selectedMonth]} {selectedYear}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Month</label>
                <Select
                  value={tempMonth.toString()}
                  onValueChange={(value) => setTempMonth(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => {
                      const isPast = tempYear === currentYear && index < currentMonth;
                      return (
                        <SelectItem
                          key={index}
                          value={index.toString()}
                          disabled={isPast}
                        >
                          {month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Year</label>
                <Select
                  value={tempYear.toString()}
                  onValueChange={(value) => setTempYear(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => currentYear + i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  onMonthChange(tempMonth, tempYear);
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Month tabs - hidden on mobile */}
      <div className="hidden md:flex gap-6 overflow-x-auto scrollbar-hide">
        {months.map((month, index) => {
          const isSelected = selectedMonth === index && selectedYear === selectedYear;
          const isPastMonthThisYear = selectedYear === currentYear && index < currentMonth;
          const hasEvents = hasEventsInMonthName(index);
          const nextOccurrence = getNextOccurrenceOfMonth(index);

          // Only disable if this month in the selected year is past AND there are no events in next occurrence
          const isDisabled = isPastMonthThisYear && selectedYear === currentYear && !hasEvents;

          const handleClick = () => {
            if (hasEvents && nextOccurrence) {
              // Navigate to next occurrence of this month
              onMonthChange(nextOccurrence.month, nextOccurrence.year);
            } else if (!isPastMonthThisYear) {
              // Navigate to this month in the selected year
              onMonthChange(index, selectedYear);
            }
          };

          return (
            <button
              key={`${month}-${selectedYear}`}
              onClick={handleClick}
              disabled={isDisabled}
              className={`
                relative px-2 py-1 text-sm font-medium transition-colors
                ${isSelected
                  ? 'text-red-600 cursor-pointer'
                  : isDisabled
                    ? 'text-gray-400/50 cursor-not-allowed'
                    : hasEvents
                      ? 'text-white hover:text-red-400 cursor-pointer'
                      : 'text-gray-400/70 hover:text-gray-300 cursor-pointer'
                }
              `}
            >
              {month}
              {isSelected && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
