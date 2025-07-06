
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ApplicationFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  eventFilter: string;
  setEventFilter: (eventId: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  events: Array<{ id: string; title: string }>;
  onClearFilters: () => void;
}

const ApplicationFilters: React.FC<ApplicationFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  eventFilter,
  setEventFilter,
  sortBy,
  setSortBy,
  dateRange,
  setDateRange,
  events,
  onClearFilters,
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-3 sm:p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search comedians..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
          />
        </div>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                !dateRange.from && "text-gray-300"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Filter by date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
              numberOfMonths={window.innerWidth < 768 ? 1 : 2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Event Filter */}
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="applied_at_desc">Latest First</SelectItem>
            <SelectItem value="applied_at_asc">Oldest First</SelectItem>
            <SelectItem value="comedian_name">Comedian Name</SelectItem>
            <SelectItem value="event_date">Event Date</SelectItem>
            <SelectItem value="most_experienced">Most Experienced</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="text-white border-white/30 hover:bg-white/10"
        >
          <Filter className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default ApplicationFilters;
